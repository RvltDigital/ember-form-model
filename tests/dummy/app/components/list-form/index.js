import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';
import { inject as service } from '@ember/service';

class ListFormComponent extends Component
{
    @service store;

    @tracked processing = false;

    @action
    async addTodo()
    {
        const todo = await this.store.createFormRecord(null, { model: 'todo' });
        this.args.model.todos.pushObject(todo);
    }

    @action
    async save()
    {
        this.processing = true;
        await this.args.model.save();
        this.processing = false;
        if (this.args.onsaved) {
            this.args.onsaved();
        }
    }

    get isInvalid()
    {
        const { name, todos } = this.args.model;
        if (name.trim() === '') {
            return true;
        }
        for (const todo of todos.toArray()) {
            if (todo.task.trim() === '') {
                return true;
            }
        }
        return false;
    }
}

export default ListFormComponent;
