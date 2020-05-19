import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';
import { inject as service } from '@ember/service';

class TodoPickerComponent extends Component
{
    @tracked task = '';
    @tracked processing = false;

    @service store;

    @action
    async save()
    {
        const task = this.task.trim();
        if (task === '') {
            return;
        }
        const todo = await this.store.createFormRecord(null, { model: 'todo' });

        todo.task = task;
        todo.list = this.args.list;

        this.processing = true;
        try {
            await todo.save();
        } catch (e) {
            console.error(e);
        }
        this.processing = false;
        todo.destroy();

        this.task = '';
    }
}

export default TodoPickerComponent;
