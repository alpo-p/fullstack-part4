const blogsRouter = require('express').Router()
const Blog = require('../models/blog')
const User = require('../models/user')

blogsRouter.get('/', async (request, response) => {
    const blogs = await Blog
        .find({})
        .populate('user', { username: 1, name: 1, id: 1 })
    response.json(blogs)
})

blogsRouter.post('/', async (request, response) => {
    const body = request.body

    const userId = request.user
    const user = await User.findById(userId)

    let likes
    !body.likes ? likes = 0 : likes = body.likes

    let blog = new Blog({
        title: body.title,
        author: body.author,
        url: body.url,
        likes: likes,
        user: userId
    })

    if (!blog.title || !blog.url) {
        response.status(400).json({ error: 'title and/or url missing!' })
    }

    const savedBlog = await blog.save()
    user.blogs = user.blogs.concat(savedBlog._id)
    await user.save()
    response.status(201).json(savedBlog)
})

blogsRouter.delete('/:id', async (request, response) => {
    const userId = request.user
    const blog = await Blog.findById(request.params.id)
    if (!userId || !blog) { return response.status(404).end() }
    //  || blog.user.toString() !== userId
    if (!request.token) {
        return response.status(401).json({ error: 'token missing or invalid' })
    }
    await Blog.findByIdAndRemove(request.params.id)
    response.status(204).end()
})

blogsRouter.put('/:id', async (request, response) => {
    const blog = new Blog(request.body)
    const re = await Blog.findByIdAndUpdate(request.params.id, blog, { new: true })
    re
        ? response.status(204).end()
        : response.status(404).end()
})

module.exports = blogsRouter