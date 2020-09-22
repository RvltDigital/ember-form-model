import { A } from '@ember/array';
import { inject as service } from '@ember/service';
import ArrayProxy from '@ember/array/proxy';
import PromiseProxyMixin from '@ember/object/promise-proxy-mixin';
import ObjectProxy from '@ember/object/proxy';
import { all, resolve } from 'rsvp';
import EmberObject, { computed, defineProperty, set } from '@ember/object';
import { getOwner } from '@ember/application';
import { capitalize } from '@ember/string';
import Snapshot from './snapshot';


class FormModel extends EmberObject
{
    _modelClass;
    _source;
    _data;
    _ready;
    _config;
    _boot = true;

    @service store;

    init(config)
    {
        super.init(...arguments);
        this.setConfig(config);
        this.reset();
    }

    setConfig(config)
    {
        const { model = null, source = null } = config;
        if (!model && !source) {
            throw new Error('There is not prototype for form model');
        }
        config.model = model || source._internalModel.modelName;
        this._source = source;
        delete config.source;
        this._config = config;
    }

    async setSource(source)
    {
        if (source._internalModel.modelName !== this._modelClass.modelName) {
            throw new Error(`Source is not instance of '${this._modelClass.modelName}' model.`);
        }
        set(this, '_source', source);
        await this.reset();
    }

    async reset()
    {
        this._ready = this.setup();
        await this._ready;
    }

    async reload()
    {
        if (this._source) {
            await this._source.reload();
        }
        await this.reset();
    }

    async setup()
    {
        const _modelFactory = this.store._modelFactoryFor(this._config.model);

        if (!_modelFactory) {
            throw new Error(`Model '${this._config.model}' was not found.`);
        }

        this._data = {
            attributes: {},
            relations: {}
        };

        this._modelClass = _modelFactory.class;

        if (!this._attrs) {
            this._attrs = [].concat(
                Array.from(this._modelClass.attributes.keys()),
                Array.from(this._modelClass.relationshipsByName.keys())
            );
        }

        this.id = this._source? this._source.id: null;

        for (const attr of this._attrs) {
            const setupFn = `setup${capitalize(attr)}`;
            if (typeof this[setupFn] === 'function') {
                await this[setupFn]();
                continue;
            }

            if (this._modelClass.attributes.has(attr)) {
                this._setupAttribute(attr);
            } else if (this._modelClass.relationshipsByName.has(attr)) {
                this._setupRelation(attr);
            } else {
                throw `Attribute '${attr}' unsetuble.`;
            }

        }
        await this.preloadAttrs();
        this._boot = false;
        return this;
    }

    _setupAttribute(name)
    {
        const descriptor = {
            enumerable: true,
            configurable: true,
            writable: true
        };

        let value;
        if (this._source) {
            value = this._source[name];
        } else {
            const defaultValue = this._modelClass.attributes.get(name).options.defaultValue;
            if (defaultValue !== undefined) {
                value = typeof defaultValue === 'function'? defaultValue(): defaultValue;
            }
        }
        this._data.attributes[name] = value;

        if (!this._boot) {
            this.notifyPropertyChange(name);
            return;
        }
        descriptor.set = (value) => this._data.attributes[name] = value;
        descriptor.get = () => this._data.attributes[name];


        defineProperty(this, name, computed(this, name, descriptor));
    }


    _setupRelation(name)
    {
        const descriptor = {
            enumerable: true,
            configurable: true,
            writable: true
        };

        delete this._data.relations[name];
        const relation = this._modelClass.relationshipsByName.get(name);
        const type = relation.type;

        if (relation.kind === 'belongsTo') {

            this._data.relations[`_${name}`] = this._source? this._source.belongsTo(name).id(): null;
            if (!this._boot) {
                this.notifyPropertyChange(name);
                return;
            }

            descriptor.set = (value) => {
                this._data.relations[name] = value;
            };
            descriptor.get = () => {
                if (this._data.relations[name]) {
                    return this._data.relations[name];
                }
                const id = this._data.relations[`_${name}`];
                let promise;
                if (!id) {
                    promise = resolve(null);
                } else {
                    promise = this.store.findRecord(type, id, { reload: false } );
                }

                return this._data.relations[name] = ObjectProxy.extend(PromiseProxyMixin).create({ promise });
            }

        } else {

            this._data.relations[`_${name}`] = this._source? this._source.hasMany(name).ids(): [];
            if (!this._boot) {
                this.notifyPropertyChange(name);
                return;
            }

            descriptor.set = (value) => {
                this._data.relations[name] = value;
            };
            descriptor.get = () => {
                if (this._data.relations[name]) {
                    return this._data.relations[name];
                }
                const ids = this._data.relations[`_${name}`];
                let promise;
                if (ids.length === 0) {
                    promise = resolve(A([]));
                } else {
                    promise = all(ids.map((id) => this.store.findRecord(type, id, { reload: false } )))
                        .then((result) => resolve(A(result)));
                }
                return this._data.relations[name] = ArrayProxy.extend(PromiseProxyMixin).create({ promise });
            }

        }

        defineProperty(this, name, computed(this, name, descriptor));
    }


    async preloadAttrs() {}

    getData()
    {
        return this._data;
    }

    serialize(options)
    {
        return this.createSnapshot().serialize(options);
    }

    createSnapshot()
    {
        return new Snapshot(this._source? this._source.id: null, this._modelClass, this._data, getOwner(this));
    }

    getAdapter()
    {
        return this.store.adapterFor(this._modelClass.modelName);
    }

    async save()
    {
        const snapshot = this.createSnapshot();
        const adapter = this.getAdapter();

        const response = await adapter[this._source? 'updateRecord': 'createRecord'](this.store, this._modelClass, snapshot);
        await this.syncRecord(response);
        await this.syncRelations(response);
    }

    async syncRecord(response)
    {
        this.store.pushPayload(response);
        if (this._source) {
            await this.reset();
            return;
        }
        const source = this.store.peekRecord(this._config.model, response.data.id);
        await this.setSource(source);
    }

    async syncRelations()
    {
        const promises = [];

        const setIverseRelation = (record, model, attr) => {
            const type = this.store._modelFactoryFor(model).class;
            const definition = type.relationshipsByName.get(attr);
            if (definition.kind === 'belongsTo') {
                record[attr] = this._source;
                return;
            }
            record[attr].addObject(this._source);
        };

        this._modelClass.relationshipsByName.forEach((definition, name) => {
            if (this._attrs.indexOf(name) === -1 || !definition.__inverseKey) {
                return;
            }
            promises.push((async () => {
                const relation = await this[name];
                if (definition.kind === 'belongsTo') {
                    setIverseRelation(relation, definition.type, definition.__inverseKey);
                    return;
                }
                relation.forEach((item) => setIverseRelation(item, definition.type, definition.__inverseKey));
            })());
        });

        await all(promises);
    }
}


export default FormModel;
