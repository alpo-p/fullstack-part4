const jwt = require('jsonwebtoken')
const blogsRouter = require('express').Router()
const Blog = require('../models/blog')
const User = require('../models/user')

const getTokenFrom = request => {
    const authorization = request.get('authorization')
    if (authorization && authorization.toLowerCase().startsWith('bearer ')) {
        return authorization.substring(7)
    }
    return null
}

blogsRouter.get('/', async (request, response) => {
    const blogs = await Blog
        .find({})
        .populate('user', { username: 1, name: 1, id: 1 })
    response.json(blogs)
})

blogsRouter.post('/', async (request, response) => {
    const body = request.body
    const token = getTokenFrom(request)
    const decodedToken = jwt.verify(token, process.env.SECRET)
    if (!token || !decodedToken.id) {
        return response.status(401).json({ error: 'token missing or invalid'})
    }

    const user = await User.findById(decodedToken.id)

    let blog = new Blog({
        title: body.title,
        author: body.author,
        url: body.url,
        likes: body.likes,
        user: user._id
    })

    if (!blog.likes) {
        blog = new Blog({ ...request.body, likes: 0 })
    }
    if (!blog.title || !blog.url) {
        response.status(400).json({ error: 'title and/or url missing!' })
    }

    const savedBlog = await blog.save()
    user.blogs = user.blogs.concat(savedBlog._id)
    await user.save()
    response.status(201).json(savedBlog)
})

blogsRouter.delete('/:id', async (request, response) => {
    try {
        await Blog.findByIdAndRemove(request.params.id)
        response.status(204).end()
    } catch(e) {
        response.status(404).end()
    }
})

blogsRouter.put('/:id', async (request, response) => {
    const blog = new Blog(request.body)
    try {
        await Blog.findByIdAndUpdate(request.params.id, blog, { new: true })
        response.status(204).end()
    } catch(e) {
        response.status(404).end()
    }
})

module.exports = blogsRouter