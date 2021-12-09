import axios from "axios";
import urljoin from "url-join";
import {Color, Product, Vendor} from "./models.js";
import jimp from "jimp";
import hexToRgba from "hex-to-rgba";
import rgb2hex from "rgb2hex";

let apiSpec = {
    host: "https://www.letu.ru",
    productJson: "storeru/product",
    product: "product",
    brand: "storeru",
}

export async function getRecords(pageNum) {
    let tonalCreamsUrl = urljoin("https://www.letu.ru/storeru/browse/makiyazh/dlya-litsa/tonalnye-sredstva",
        `page-${pageNum}`,
        "?format=json")
    let productsResponse = await axios.get(tonalCreamsUrl)
    return productsResponse.data.contents[0].mainContent[4].result.records
}

function buildProductJsonUrl(record) {
    let attr = record.attributes
    return urljoin(apiSpec.host, apiSpec.productJson, attr['product.sefName'][0], attr['product.repositoryId'][0])
}

function getProductContent(productResponse) {
    return productResponse.data.contents[0].mainContent[0].contents[0].productContent[0]
}

export async function parseRecord(record) {
    return await getProduct(record)
}

async function getBrand(product) {
    let brandBaseUrl = urljoin(apiSpec.host, apiSpec.brand, product.brandNavigationURL)
    let brandJsonUrl = urljoin(brandBaseUrl, '?format=json')
    let brandResponse = await axios.get(brandJsonUrl)
    let brandContent
    try {
        brandContent = brandResponse.data.contents[0].mainContent[1].result.brand
    } catch (e) {
        brandContent = brandResponse.data.contents[0].mainContent.find((el, _, __) => {
            return el.hasOwnProperty('brandName')
        })
        return new Vendor(brandContent.brandName, brandBaseUrl)
    }
    return new Vendor(brandContent.name, brandBaseUrl)
}

async function getColors(skuList) {
    let colors = []
    for (let color of skuList) {
        let colorImageUr = urljoin(apiSpec.host, color.shadesImage.url)

        let image = await jimp.read(colorImageUr)
        let colorHexRGBA = image.getPixelColor(25, 25).toString(16)
        let colorRGBA = hexToRgba(colorHexRGBA)

        colors.push(
            new Color(color.displayName, rgb2hex(colorRGBA).hex)
        )
    }
    return colors
}

async function getProduct(record) {
    let attr = record.attributes
    let productJsonUrl = urljoin(apiSpec.host, apiSpec.productJson, attr['product.sefName'][0], attr['product.repositoryId'][0])
    let productUrl = urljoin(apiSpec.host, apiSpec.product, attr['product.sefName'][0], attr['product.repositoryId'][0])

    let productResponse = await axios.get(productJsonUrl)
    let productContent = getProductContent(productResponse)

    return new Product(
        productContent.product.displayName,
        productUrl,
        await getColors(productContent.skuList),
        await getBrand(productContent.product)
    )
}
