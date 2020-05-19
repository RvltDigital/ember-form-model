import Route from '@ember/routing/route';
import { get } from '@ember/object';

class NewListRoute extends Route
{
    async model()
    {
        return get(this, 'controller.model') || await this.store.createFormRecord('list');
    }
}

export default NewListRoute;
