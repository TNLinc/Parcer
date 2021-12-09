export class Vendor {
    constructor(name, url) {
        this.name = name
        this.url = url
    }
}

export class Color {
    constructor(name, color) {
        this.name = name
        this.color = color

    }

}

export class Product {
    constructor(name, url, colors, vendor) {
        this.name = name
        this.url = url
        this.colors = colors
        this.vendor = vendor
    }
}
