import { getOwner } from '@ember/application';

async function createFormRecord(name, options = {})
{
    if (!name) {
        name = 'main';
    }
    const factory = getOwner(this).factoryFor(`form-model:${name}`);
    if (!factory) {
        throw new Error(`Factory for "${name}" form model is not defined.`);
    }

    const model = factory.create(options);
    await model._ready;
    return model;
}

export function initialize(appInstance) {
    const store = appInstance.lookup('service:store');
    store.reopen({ createFormRecord });
}

export default {
    initialize
};
