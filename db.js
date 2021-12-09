import pg from "pg";
import format from "pg-format";
import dotenv from "dotenv"

dotenv.config()
let client = new pg.Client({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
    ssl: {
        rejectUnauthorized: false
    }
})
await client.connect()

export async function getAllVendors() {
    return (await client.query('SELECT * from vendor.vendor')).rows
}

export async function getByName(table, name) {
    let query = format('SELECT * FROM %s WHERE name = $1', table)
    return (await client.query(query, [name])).rows
}

async function insertVendor(vendor) {
    let existedVendor = await getByName('vendor.vendor', vendor.name)
    if (existedVendor.length === 0) {
        console.info(`Insert vendor: ${vendor.name}`)
        let vendorId = await client.query('INSERT INTO vendor.vendor (name, url) VALUES ($1, $2) RETURNING id',
            [vendor.name, vendor.url])
        return vendorId.rows[0].id
    }
    return existedVendor[0].id
}

async function insertColor(color, vendorId) {
    let existedColor = await getByName('vendor.vendor_color', color.name)
    if (existedColor.length === 0) {
        console.info(`Insert color: ${color.name}`)
        let colorId = await client.query('INSERT INTO vendor.vendor_color (name, color, vendor_id) VALUES ($1, $2, $3) RETURNING id',
            [color.name, color.color, vendorId])
        return colorId.rows[0].id
    }
    return existedColor[0].id
}

async function insertProduct(product, vendorId, colorId) {
    let existedProduct = await getByName('vendor.product', product.name)
    if ((existedProduct.length === 0) || (existedProduct.color_id !== colorId)) {
        console.info(`Insert product: ${product.name}`)
        let productID = await client.query('INSERT INTO vendor.product (name, type, vendor_id, color_id, url) VALUES ($1, $2, $3, $4, $5) RETURNING id',
            [product.name, 'TONAL_CREAM', vendorId, colorId, product.url])
        return productID.rows[0].id
    }
    return existedProduct[0].id
}

export async function saveProduct(product) {
    let vendorId = await insertVendor(product.vendor)
    for (let color of product.colors) {
        let colorId = await insertColor(color, vendorId)
        await insertProduct(product, vendorId, colorId)
    }
}
