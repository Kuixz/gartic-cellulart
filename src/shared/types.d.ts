
type Maybe<T> = T | undefined


type GeomRawImage = {
    width: number;
    height: number;
    data: any
}

const isGeomRawImage = (value: any): value is GeomRawShape => {
    return (
        value 
        && typeof value.width === "number" 
        && typeof value.height === "number" 
    )
}

Object.defineProperty(isGeomRawImage, Symbol.hasInstance, {
    value(instance) {
        return isGeomRawImage(instance);
    },
})


type GeomRawShape = {
    type: number;
    raw: number[];
    svg: string;
    color: number;
}

const isGeomRawShape = (value: any): value is GeomRawShape => {
    return (
        value 
        && typeof value.type === "number" 
        && Array.isArray(value.raw)
        && typeof value.svg === "string" 
        && typeof value.color === "number"
    )
}

Object.defineProperty(isGeomRawShape, Symbol.hasInstance, {
    value(instance) {
        return isGeomRawShape(instance);
    },
})


type GeomSerializedShape = {
    fst: string
    snd: string
}

const isGeomSerializedShape = (value: any): value is GeomSerializedShape => {
    return (
        value 
        && typeof value.fst === "string" 
        && typeof value.snd === "string"
    )
}

Object.defineProperty(isGeomSerializedShape, Symbol.hasInstance, {
    value(instance) {
        return isGeomSerializedShape(instance);
    },
})
