import FormModel from 'ember-form-model';
import { all } from 'rsvp';

class ListFormModel extends FormModel
{
    init(config = {})
    {
        config.model = 'list';
        super.init(config);
    }

    async setupTodos()
    {
        if (!this._boot) {
            return;
        }

        await this._setupRelation('todos');

        this.todos.setObjects(
            await all((await this.todos).map((source) => this.store.createFormRecord(null, { source })))
        );
    }

    async save()
    {
        await super.save();
        await all(this.todos.map((todo) => todo.save()));
    }

    destroy()
    {
        this.todos.forEach((todo) => todo.destroy());
        super.destroy();
    }
}


export default ListFormModel;
