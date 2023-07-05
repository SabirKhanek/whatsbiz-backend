function cleanRequest(request) {
    // Remove extra whitespace after newlines
    request = request.replace(/\n\s+/g, '\n');

    // Remove non-textual characters except spaces, alphanumeric characters, and common punctuation marks
    request = request.replace(/[^\w\s.,?!'"():;/[\]]/g, '').trim();

    return request;
}

console.log(cleanRequest(`*WTS*
*IPad 2022 m2* 🏡
📲 *iPad pro 12.9 128 5g m2* 
Gray 
Silver
0📲 *iPad Pro 12.9" 256 5g* 
Silver 
Gray 
📲 *iPad pro 12.9 512 5g m2* 
Silver 
*Ready in local*🔥`))