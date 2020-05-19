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

        let type;
        this.type.eachRelationship((name, meta) => name === keyName && (type = meta.type));
        const id = get(this, `_data.relations.${keyName}.id`) || this._data.relations[`_${keyName}`];

        if (id) {
            if (options && options.id === true) {
                return id;
            }
            return this._owner.lookup('service:store')._internalModelForResource({ id, type }).createSnapshot();
        }

        return null;
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

        let type;
        this.type.eachRelationship((name, meta) => name === keyName && (type = meta.type));
        const relation = this._data.relations[keyName];
        const store = this._owner.lookup('service:store');
        const ids = relation? relation.map((item) => item.id): this._data.relations[`_${keyName}`];

        if (options && options.id === true) {
            return ids;
        }

        const result = [];
        ids.forEach((id) => id && result.push(store._internalModelForResource({ id, type }).createSnapshot()))
        return result;
    }

    serialize(options)
    {
        return this._owner.lookup('service:store').serializerFor(this.type.modelName).serialize(this, options);
    }
}

export default Snapshot;
