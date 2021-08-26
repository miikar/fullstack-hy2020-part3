require('dotenv').config();
const express = require('express')
const morgan = require('morgan')
const cors = require('cors')
const Person = require('./models/person')
const app = express()

// Setup middlewares
morgan.token('body', (req, res) => {
  return JSON.stringify(req.body)
})

app.use(express.static('build'))
app.use(cors())
app.use(express.json())
app.use(morgan(':method :url :status :res[content-length] - :response-time ms :body'))


// REST API
app.get('/info', (req, res) => {
  Person.countDocuments({})
    .then(result => {
      msg = `
        <p>Phonebook has ${result} people</p>
        <p>${new Date()}</p>`
      res.send(msg) 
    })
})

app.get('/api/persons', (req, res) => {
  Person.find({}).then(persons => {
    res.json(persons)
  })
})

app.get('/api/persons/:id', (req, res, next) => {
  Person.findById(req.params.id)
    .then(person => {
      if (person) {
        res.json(person)
      } else {
        res.status(400).end()
      }
    })
    .catch(error => next(error))
})

app.delete('/api/persons/:id', (req, res, next) => {
  Person.findByIdAndRemove(req.params.id)
    .then(result => {
      res.status(204).end()
    })
    .catch(error => next(error))
})

app.post('/api/persons', (req, res, next) => {
  const body = req.body

  const person = new Person({
    name: body.name,
    number: body.number,
  })
  
  person.save()
    .then(savedPerson => savedPerson.toJSON())
    .then(savedAndFormattedPerson => res.json(savedAndFormattedPerson))
    .catch(error => next(error))
      
      
})

app.put('/api/persons/:id', (req, res, next) => {
  const body = req.body

  const person = {
    number: body.number
  }

  Person.findByIdAndUpdate(req.params.id, person, { new: true, runValidators: true })
    .then(updatedPerson => {
      res.json(updatedPerson)
    })
    .catch(error => next(error))
})

// Middleware: Not found
const unknownEndpoint = (request, response) => {
  response.status(404).send({ error: 'unknown endpoint' })
}

app.use(unknownEndpoint)

// Middleware: Error handling
const errorHandler = (error, request, response, next) => {
  console.error(error.message)

  if (error.name === 'CastError') {
    return response.status(400).send({ error: 'malformatted id' })
  } else if (error.name === 'ValidationError') {
    return response.status(400).json({ error: error.message })
  }

  next(error)
}

app.use(errorHandler)

const PORT = process.env.PORT
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)  
})
