import FormModel from 'ember-form-model';

export function initialize(application)
{
    application.register('form-model:main', FormModel);
}

export default {
    initialize
};
