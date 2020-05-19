import Controller from '@ember/controller';
import { action } from '@ember/object';

class NewListController extends Controller
{
    @action
    async onSaved()
    {
        await this.transitionToRoute('list', this.model.id);
        this.model.destroy();
        this.model = null;
    }
}

export default NewListController;
