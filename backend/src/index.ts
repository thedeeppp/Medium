//@ts-ignore
import { Hono } from 'hono'//@ts-ignore
import { PrismaClient } from '@prisma/client/edge'//@ts-ignore
import { withAccelerate } from '@prisma/extension-accelerate'//@ts-ignore
import { sign, verify } from 'hono/jwt'

const app = new Hono<{
	Bindings: {
		DATABASE_URL: string,
		JWT_SECRET: string,
		c:string
	}
}>();

app.use('/api/v1/blog/*', async (c: { req: { header: (arg0: string) => any; }; status: (arg0: number) => void; json: (arg0: { error: string; }) => any; env: { JWT_SECRET: any; }; set: (arg0: string, arg1: any) => void; }, next: () => any) => {
	const jwt = c.req.header('Authorization');
	if (!jwt) {
		c.status(401);
		return c.json({ error: "unauthorized" });
	}
	const token = jwt.split(' ')[1];
	const payload = await verify(token, c.env.JWT_SECRET);
	if (!payload) {
		c.status(401);
		return c.json({ error: "unauthorized" });
	}
	c.set('userId', payload.id);
	await next()
})

app.post('/api/v1/signup', async (c: { env: { DATABASE_URL: any; JWT_SECRET: any; }; req: { json: () => any; }; json: (arg0: { jwt?: any; error?: string; }) => any; status: (arg0: number) => void; }) => {
	const prisma = new PrismaClient({
		datasourceUrl: c.env.DATABASE_URL	,
	}).$extends(withAccelerate());

	const body = await c.req.json();
	try {
		const user = await prisma.user.create({
			data: {
				email: body.email,
				password: body.password
			}
		});
		const jwt = await sign({ id: user.id }, c.env.JWT_SECRET);
		return c.json({ jwt });
	} catch(e) {
		c.status(403);
		return c.json({ error: "error while signing up" });
	}
})

app.post('/api/v1/user/signup', async(c: { env: { DATABASE_URL: any; JWT_SECRET: any; }; req: { json: () => any; }; status: (arg0: number) => void; json: (arg0: { error?: string; jwt?: any; }) => any; }) => {
  const prisma = new PrismaClient({
		datasourceUrl: c.env.DATABASE_URL	,
	}).$extends(withAccelerate());

  const body = c.req.json()
  const user = await prisma.user.findUnique({
    where:{
      email: body.email
    }
  })
  if(!user) {
      c.status(403);
      return c.json({error:"user not found!"})
  }
  const jwt = await sign({id:user.id}, c.env.JWT_SECRET)
  return c.json({jwt})
})


app.post('/api/v1/blog', (c: { text: (arg0: string) => any; }) => {
  return c.text('Hello Hono!')
})

app.put('/api/v1/blog', (c: { text: (arg0: string) => any; }) => {
  return c.text('Hello Hono!')
})

app.get('/api/v1/blog/:id', (c: { text: (arg0: string) => any; }) => {
  return c.text('Hello Hono!')
})

app.get('/api/v1/blog/bulk', (c: { text: (arg0: string) => any; }) => {
  return c.text('Hello Hono!')
})

export default app
