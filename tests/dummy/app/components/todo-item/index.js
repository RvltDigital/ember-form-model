import Component from '@glimmer/component';
import { guidFor } from '@ember/object/internals';
import { action } from '@ember/object';
import { inject as service } from '@ember/service';
import { tracked } from '@glimmer/tracking';

class TodoItemComponent extends Component
{
    @tracked model;
    @tracked processing = false;

    @service store;

    get guid()
    {
        return guidFor(this);
    }

    @action
    async toggleIsDone({ target: { checked: isDone } })
    {
        const todo = await this.store.createFormRecord(null, { source: this.args.model });

        todo.isDone = isDone;
        this.processing = true;
        try {
            await todo.save();
        } catch (e) {
            console.error(e);
        }
        this.processing = false;
        todo.destroy();
    }
}

export default TodoItemComponent;
