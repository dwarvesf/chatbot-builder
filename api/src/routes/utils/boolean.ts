export function stringToBoolean(queryString: string): boolean | null{
    if(queryString === undefined) return null;
    else if(queryString.toLowerCase() === 'true') return true;
    else if(queryString.toLowerCase() === 'false') return false;    
    
}