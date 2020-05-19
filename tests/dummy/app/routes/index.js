import Route from '@ember/routing/route';
import { all } from 'rsvp';

class IndexRoute extends Route
{
    async model()
    {
        const lists = await this.store.findAll('list');
        await all(lists.mapBy('todos'));
        return lists;
    }
}

export default IndexRoute;
