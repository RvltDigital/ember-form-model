import JSONAPIAdapter from '@ember-data/adapter/json-api';

class ApplicationAdapter extends JSONAPIAdapter
{
    namespace = 'api';
    coalesceFindRequests = true;

    shouldBackgroundReloadRecord()
    {
        return false;
    }
}

export default ApplicationAdapter;
