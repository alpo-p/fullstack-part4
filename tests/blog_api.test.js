const mongoose = require('mongoose')
const supertest = require('supertest')
const app = require('../app')
const api = supertest(app)
const Blog = require('../models/blog')
const User = require('../models/user')
const bcrypt = require('bcrypt')

const initialBlogs = [
    {
        _id: '6048bc84c7631d308b8d84e6',
        title: 'Fullstack',
        author: 'Alpo Panula',
        url: 'www.alpo.io',
        likes: 42,
        __v: 0
    },
    {
        _id: '6048c919ff4ed455232bd47a',
        title: 'How to fix your motorcycle',
        author: 'Alexi Laiho',
        url: 'www.bodom.io',
        likes: 715517,
        __v: 0
    }
]

beforeEach(async () => {
    await Blog.deleteMany({})

    for (let blog of initialBlogs) {
        let blogObject = new Blog(blog)
        await blogObject.save()
    }

})

test('blogs are returned as json', async () => {
    await api
        .get('/api/blogs')
        .expect(200)
        .expect('Content-Type', /application\/json/)
})

test('all blogs are returned', async () => {
    const response = await api.get('/api/blogs')
    expect(response.body).toHaveLength(initialBlogs.length)
})

test('the first title is Fullstack', async () => {
    const response = await api.get('/api/blogs')
    //console.log(response)
    expect(response.body[0].title).toBe('Fullstack')
})

describe('blog adding works: ', () => {
    const userCreds = { username: 'baloo', password: 'sekret' }
    let token
    beforeEach(async () => {
        await User.deleteMany({})
        
        const passwordHash = await bcrypt.hash('sekret', 10)
        const user = new User({ username: 'baloo', passwordHash })
        await user.save()
        
        const login = await api
            .post('/api/login')
            .send(userCreds)
        token = `bearer ${login.body.token}`
    })


    test('a valid blog can be added', async () => {
        const newBlog = {
            title: 'lorem ipsum',
            author: 'Elon Musk',
            url: 'tesla.com',
            likes: 42,
        }
    
        await api
            .post('/api/blogs')
            .set('Authorization', token)
            .send(newBlog)
            .expect(201)
            .expect('Content-Type', /application\/json/)
    
        const response = await api.get('/api/blogs')
        
        const author = response.body.map(r => r.author)
    
        expect(response.body).toHaveLength(initialBlogs.length + 1)
        expect(author).toContain('Elon Musk')
    })
    
    test('a unique identifier property is named id', async () => {
        const response = await api.get('/api/blogs')
        response.body.forEach(blog => {
            expect(blog.id).toBeDefined()
        })
    })
    
    test('if likes property is missing, value defaults to 0', async () => {
        const newBlog = {
            title: 'lorem ipsum',
            author: 'Joe Rogan',
            url: 'JRE'
        }
    
        const response = await api
            .post('/api/blogs')
            .set('Authorization', token)
            .send(newBlog)
        
        expect(response.body.likes).toBe(0)
    })
    
    test('if title and url are missing, returns 400 Bad Request', async () => {
        const newBlog = {
            author: 'Monty Python',
            likes: 42,
        }
    
        await api
            .post('/api/blogs')
            .set('Authorization', token)
            .send(newBlog)
            .expect(400)
    })
})

test('updating of likes succeeds with correct likes and status code', async () => {
    const blogAtStart = initialBlogs[0]
    const id = blogAtStart._id
    const initialLikes = blogAtStart.likes

    const editedBlog = { ...blogAtStart, likes: initialLikes + 1}

    await api
        .put(`/api/blogs/${id}`)
        .send(editedBlog)
        .expect(204)
    
    const blogAtEnd = await Blog.findById(id)
    expect(blogAtEnd.likes).toBe(initialLikes + 1)
})

afterAll(() => {
    mongoose.connection.close()
})