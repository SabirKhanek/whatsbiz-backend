const { db } = require('./');
const ExcelJS = require('exceljs');
const { add_pivot } = require('./pivotTable');

function generateProductData(time_filter) {
    const query = `
        SELECT 
        product.intent AS Intent,
        product.name AS Name,
        product.type AS Type,
        product.brand AS Brand,
        product.quantity AS Quantity,
        product.condition AS Condition,
        product.price AS Price,
        product.remarks AS Remarks,
        product.ram AS Ram,
        product.color AS Color,
        product.storage AS Storage,
        product.processor AS Processor,
        chat.chatName AS ChatName,
        chat.chatMessage AS Message,
        chat.chatMessageAuthor AS Author,
        datetime(chat.chatMessageTime, 'unixepoch') AS messagetime
        FROM 
        Chat chat
        JOIN 
        Product product ON chat.id = product.chatId
        WHERE chat.chatMessageTime > ?
        `
        ;

    let timeFrom = (new Date().getTime()) / 1000;
    timeFrom = timeFrom - (time_filter ? time_filter : 3600);

    const getData = db.prepare(query);
    const data = getData.all(timeFrom);
    return data
}

async function generateProductExcel(time_filter = (new Date().getTime() / 1000)) {
    const data = generateProductData(time_filter);

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Products');

    // Define headers for the worksheet
    const workbook_columns = [
        { header: 'Intent', key: 'intent' },
        { header: 'Product Name', key: 'name' },
        { header: 'Product Type', key: 'type' },
        { header: 'Ram', key: 'ram' },
        { header: 'Color', key: 'color' },
        { header: 'Storage', key: 'storage' },
        { header: 'Processor', key: 'processor' },
        { header: 'Brand', key: 'brand' },
        { header: 'Quantity', key: 'quantity' },
        { header: 'Condition', key: 'condition' },
        { header: 'Price', key: 'price' },
        { header: 'Remarks', key: 'remarks' },
        { header: 'Message', key: 'message' },
        { header: 'Chat Name', key: 'chatname' },
        { header: 'Author', key: 'author' },
        { header: 'Message Time', key: 'messagetime' },
    ];

    worksheet.columns = workbook_columns.map(column => {
        return { ...column, width: undefined };
    });

    // Set the style of the column headers to blue
    worksheet.getRow(1).eachCell((cell, columnNumber) => {
        cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF0070C0' }, // blue
        };
        cell.font = {
            color: { argb: 'FFFFFFFF' }, // white
        }
    });

    // Get keys stated in workbook headers
    keys = []
    workbook_columns.forEach(column => {
        keys.push(column.key.toLowerCase())
    })


    // Convert columns to lowercase to match with headers
    const lowerCasedData = data.map(obj => {
        const keys = Object.keys(obj).map(key => key.toLowerCase());
        const values = Object.values(obj);
        return Object.fromEntries(keys.map((key, index) => [key, values[index]]));
    });

    // Add data to the worksheet
    lowerCasedData.forEach(row => {
        const newRow = {}
        keys.forEach(key => {
            newRow[key] = row[key]
        })
        worksheet.addRow(newRow);
    });

    lowerCasedData.forEach(row => {
        Object.keys(row).forEach((key, index) => {
            const column = worksheet.getColumn(index + 1); // Excel columns are 1-indexed
            const cellWidth = (row[key] && row[key].toString().length + 2) || 10; // add 2 for padding
            const desired_width = Math.max((column.width || 0), cellWidth);
            column.width = (desired_width >= 60 ? 60 : desired_width); // take the max of the current width and the cell width
        });
    });


    // worksheet.eachRow((row, rowNumber) => {
    //     const intentCell = row.getCell('intent');
    //     const text = intentCell.text.toString().toLowerCase()
    //     if (text.includes('buy')) {
    //         intentCell.fill = {
    //             type: 'pattern',
    //             pattern: 'solid',
    //             fgColor: { argb: 'FF92D050' }, // green
    //         };
    //     } else if (text.includes('sell')) {
    //         intentCell.fill = {
    //             type: 'pattern',
    //             pattern: 'solid',
    //             fgColor: { argb: 'FFFF0000' }, // red
    //         };
    //     }
    // });



    const timestamp = new Date().toISOString().replace(/[-:.]/g, '');
    const filename = `products_${timestamp}.xlsx`;

    const file_path = `./db/` + filename;

    // Save the workbook to a file
    await workbook.xlsx.writeFile(file_path)

    await add_pivot(filename)

    return file_path;
}


function generateClassifiedMessages() {
    const query = db.prepare('SELECT * FROM CLASSIFIED_MESSAGES');
    return query.all();
}

async function generateClassifiedMessagesExcel() {
    const data = generateClassifiedMessages();

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Classified Messages');

    // Define headers for the worksheet
    const workbook_columns = [
        { header: 'Message', key: 'message' },
        { header: 'Intent', key: 'intent' },
    ];

    worksheet.columns = workbook_columns.map(column => {
        return { ...column, width: undefined };
    });

    // Add data to the worksheet
    data.forEach(row => {
        worksheet.addRow({
            message: row.message,
            intent: row.intent,
        });
    })

    const timestamp = new Date().toISOString().replace(/[-:.]/g, '');
    const filename = `./db/generated_local_classifications_${timestamp}.xlsx`;


    const file_path = filename;

    // Save the workbook to a file
    await workbook.xlsx.writeFile(file_path)


    return file_path;
}

module.exports.generateClassifiedMessagesExcel = generateClassifiedMessagesExcel;

module.exports.getExcelPath = generateProductExcel;
