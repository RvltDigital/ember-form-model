import { get } from '@ember/object';

class Snapshot
{
    adapterOptions;
    id;
    modelName;
    type;

    _data;
    _owner;
    _internalModel;

    constructor(id, type, data, owner)
    {
        this.id = id;
        this.type = type;
        this.modelName = type.modelName;

        this._data = data;
        this._owner = owner;
        if (id) {
            this._internalModel = this._owner.lookup('service:store')._internalModelForResource({ id, type: this.modelName });
        }
    }

    get record()
    {
        return this._internalModel? this._internalModel.getRecord(): null;
    }

    attr(name)
    {
        return this.attributes()[name];
    }

    attributes()
    {
        return this._data.attributes;
    }

    belongsTo(keyName, options)
    {
        if (this._data.relations[`_${keyName}`] === undefined) {
            return undefined;
        }

        let id = null;
        if (this._data.relations[keyName] === undefined) {
            id = this._data.relations[`_${keyName}`];
        } else {
            id = get(this, `_data.relations.${keyName}.id`) || null;
        }

        if (id === null) {
            return null;
        }

        if (options && options.id === true) {
            return id;
        }

        let type;
        this.type.eachRelationship((name, meta) => name === keyName && (type = meta.type));
        return this._owner.lookup('service:store')._internalModelForResource({ id, type }).createSnapshot();
    }

    changedAttributes()
    {
        return Object.keys(this.attributes());
    }

    eachAttribute(callback, binding)
    {
        this.type.eachAttribute(callback, binding);
    }

    eachRelationship(callback, binding)
    {
        this.type.eachRelationship(callback, binding);
    }

    hasMany(keyName, options)
    {
        if (this._data.relations[`_${keyName}`] === undefined) {
            return undefined;
        }

        const relation = this._data.relations[keyName];
        let ids = [];
        if (relation === undefined) {
            ids = this._data.relations[`_${keyName}`];
        } else if (relation) {
            ids = relation.map((item) => item.id);
        }

        if (options && options.id === true) {
            return ids;
        }

        const result = [];
        let type;
        this.type.eachRelationship((name, meta) => name === keyName && (type = meta.type));
        const store = this._owner.lookup('service:store');
        ids.forEach((id) => id && result.push(store._internalModelForResource({ id, type }).createSnapshot()));
        return result;
    }

    serialize(options)
    {
        return this._owner.lookup('service:store').serializerFor(this.type.modelName).serialize(this, options);
    }
}

export default Snapshot;
