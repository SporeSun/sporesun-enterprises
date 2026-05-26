import imagekit from "@/configs/imagekit";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// add new product
export async function POST(request) {
    try {
        const { userId } = getAuth(request)
        const storeId = await authSeller(userId)

        if (!storeId) {
            return NextResponse.json ({error: 'not authorized'}, { status: 401 } )
        }
        // Get data from form
        const formData = await request.formData()
        const name = formData.get("name")
        const description = formData.get("description")
        const mrp = Number(formData.get("mrp"))
        const price = Number(formData.get("price"))
        const images = formData.getAll("images")

        if (!name || !description || !mrp || !price || !categoryt || images.length < 1) {
            return NextResponse.json ({error: 'missing product details'}, { status: 400 } )
        }

        //Uploading images to Imagekit
        const imagesURL = await Promise.all(images.map(async (image) => {
            const buffer = Buffer.from(await image.arrayBuffer());
            const response = await imagekit.upload({
                file: buffer,
                filename: image.name,
                folder: "products",

            })
            const url = imagekit.url({
                path: response.filePath,
                transformation: [
                    { quality: 'auto' },
                    { format: 'webp' },
                    { width: '1024' }
                ]
            })
            return url
        }))

        await prisma.product.create({
            data: {
                name,
                description,
                mrp,
                price,
                category,
                images: imagesURL,
                storeID
            }
        })

        return NextResponse.json({message: "Product added successfully"})
        
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: error.code || error.message }, { status: 400 })
    }
}

// Get all products for a seller
export async function GET(request){
    try {
        const { userId } = getAuth(request)
        const storeId = await authSeller(userId)

        if (!storeId) {
            return NextResponse.json ({error: 'not authorized'}, { status: 401 } )
        }
        const products = await prisma.product.findMany({ where: { storeID }})

        return NextResponse.json({products })
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: error.code || error.message }, { status: 400 })
    }
}