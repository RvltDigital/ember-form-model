import Route from '@ember/routing/route';

class ListRoute extends Route
{
    async model({ id })
    {
        const source = await this.store.findRecord('list', id);
        return await this.store.createFormRecord('list', { source });
    }

    resetController(controller, isExiting)
    {
        if (!isExiting) {
            return;
        }
        controller.model.destroy();
    }
}

export default ListRoute;
