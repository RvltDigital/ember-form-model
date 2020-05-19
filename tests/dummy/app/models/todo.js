import Model, { attr, belongsTo } from '@ember-data/model';

class TodoModel extends Model
{
    @attr('string', { defaultValue: '' }) task;
    @attr('boolean', { defaultValue: false }) isDone;

    @belongsTo('list') list;
}

export default TodoModel;
