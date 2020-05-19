
function attr(target, property, descriptor)
{
    target._attrs = target._attrs? target._attrs.slice(0): [];

    if (target._attrs.includes(property)) {
        return;
    }

    target._attrs.push(property);

    return descriptor;
}


export default attr;
