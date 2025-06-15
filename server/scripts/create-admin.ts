//bun run scripts/create-admin.ts admin@menslungi.com menslungiscrete to create admin
import prisma from "../server/DB/db.config.ts";
import { hash } from 'bcrypt';

async function createAdmin() {
    const email = process.argv[2];
    const password = process.argv[3];


    if(!email || !password){
        console.error(`❌ Usage: bun ${email} ${password}`)
        process.exit(1)
    }

    const hashed = await hash(password,10)

    await prisma.user.create({
        data:{
            email,
            password: hashed,
            role: 'ADMIN'
        }
    })
    console.log(`✅ Admin created: ${email}`);
}

createAdmin().finally(()=> prisma.$disconnect());
