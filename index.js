import {getAllVendors, saveProduct} from "./db.js";
import {getRecords, parseRecord} from "./letua_api.js";

let vendors = await getAllVendors()
console.info(`We have ${vendors.length} vendors`)

for (let i = 0; i < 12; i++) {
    console.info(`Processing page ${i}`)
    try {
        for (let record of await getRecords(i)) {
            console.info(`Processing ${record.attributes['product.sefName'][0]}`)

            try {
                let product = await parseRecord(record)
                await saveProduct(product)
            } catch (e) {
                console.error(e)
                continue
            }
        }
    } catch (e) {
        console.error(e)
        continue
    }
}

process.exit();
