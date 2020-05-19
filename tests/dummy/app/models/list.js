import Model, { attr, hasMany } from '@ember-data/model';

class ListModel extends Model
{
    @attr('string', { defaultValue: '' }) name;

    @hasMany('todo') todos;
}


export default ListModel;
