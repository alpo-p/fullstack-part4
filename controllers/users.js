const bcrypt = require('bcrypt')
const usersRouter = require('express').Router()
const User = require('../models/user')

usersRouter.get('/', async (request, response) => {
    const users = await User
        .find({})
        .populate('blogs', { url: 1, title:1, id:1, author:1 })
    response.json(users)
})


usersRouter.post('/', async (request, response) => {
    const body = request.body
    let passwordHash

    const saltRounds = 10
    if (body.password.length > 3) {
        passwordHash = await bcrypt.hash(body.password, saltRounds)
    } else {
        response.status(400).json({ error: 'password must be longer than 3 characters' })
    }

    const user = new User({
        username: body.username,
        name: body.name,
        passwordHash
    })

    const savedUser = await user.save()
    response.status(200).json(savedUser)
})


module.exports = usersRouter