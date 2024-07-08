import { PrismaClient } from "@prisma/client/edge";
import { withAccelerate } from "@prisma/extension-accelerate";
import { Hono } from "hono";
import { verify } from "hono/jwt";

const prisma = new PrismaClient().$extends(withAccelerate());

export const bookRouter = new Hono<{
    Bindings: {
        DATABASE_URL: string;
        JWT_SECRET: string;
    },
    Variables: {
        userId: string;
    }
}>();

bookRouter.use('/*', async (c, next) => {
    try {
        const jwt = c.req.header('Authorization') || "";
        if (!jwt) {
            c.status(401);
            return c.json({ error: "unauthorized", message: "JWT not found" });
        }
        
        console.log("Authorization Header:", jwt); // Log the Authorization header
        
        const tokenParts = jwt.split(' ');
        if (tokenParts.length !== 2 || tokenParts[0] !== 'Bearer') {
            c.status(401);
            return c.json({ error: "unauthorized", message: "Bearer token missing or invalid format" });
        }

        const token = tokenParts[1];
        console.log("Extracted Token:", token); // Log the extracted token

        const payload = await verify(token, c.env.JWT_SECRET);
        if (!payload) {
            c.status(401);
            return c.json({ error: "unauthorized", message: "Invalid token" });
        }

        c.set('userId', payload.id);
        await next();
    } catch (error) {
        console.error("Error in JWT verification:", error); // Logging the error
        c.status(401);
        return c.json({ error: "unauthorized", message: error.message });
    }
});



bookRouter.post('/', async (c) => {
    const userId = c.get('userId');
    const body = await c.req.json();
    try {
        const post = await prisma.post.create({
            data: {
                title: body.title,
                content: body.content,
                authorId: Number(userId),
            },
        });
        return c.json({ id: post.id });
    } catch (error) {
        c.status(500);
        return c.json({ error: "Failed to create post" });
    }
});

bookRouter.put('/', async (c) => {
    const userId = c.get('userId');
    const body = await c.req.json();
    try {
        await prisma.post.update({
            where: {
                id: body.id,
                authorId: userId,
            },
            data: {
                title: body.title,
                content: body.content,
            },
        });
        return c.text('updated post');
    } catch (error) {
        c.status(500);
        return c.json({ error: "Failed to update post" });
    }
});

bookRouter.get('/:id', async (c) => {
    const id = c.req.param('id');
    try {
        const post = await prisma.post.findUnique({
            where: {
                id: Number(id),
            },
        });
        if (post) {
            return c.json(post);
        } else {
            c.status(404);
            return c.json({ error: "Post not found" });
        }
    } catch (error) {
        c.status(500);
        return c.json({ error: "Failed to fetch post" });
    }
});
