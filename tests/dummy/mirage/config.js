

export default function() {

    this.namespace = '/api';    // make this `/api`, for example, if your API is namespaced
    this.timing = 500;      // delay for each request, automatically set to 0 during testing

    const models = [ 'lists', 'todos' ];

    for (const model of models) {
        this.get(`/${model}/:id`);
        this.get(`/${model}`, { coalesce: true });
        this.post(`/${model}`);
        this.patch(`/${model}/:id`);
    }
}
