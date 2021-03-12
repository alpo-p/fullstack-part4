const blogsRouter = require('express').Router()
const Blog = require('../models/blog')

blogsRouter.get('/', async (request, response) => {
    const blogs = await Blog.find({})
    response.json(blogs)
})

blogsRouter.post('/', async (request, response) => {
    let blog = new Blog(request.body)
    if (!blog.likes) {
        blog = new Blog({ ...request.body, likes: 0 })
    }
    if (!blog.title || !blog.url) {
        response.status(400).json({ error: 'title and/or url missing!' })
    }
    const result = await blog.save()
    response.status(201).json(result)
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