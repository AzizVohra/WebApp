const { sequelize,User,Product} = require('./models')
const express = require('express')
const app = express()
app.use(express.json())
const bcrypt = require('bcrypt');
const auth=require('./auth/auth')

app.get('/healthz', async (req, res) => {
  res.sendStatus(200);
})

///POSTING USER INFORMATION
app.post('/v1/users', async (req, res) => {
  const { first_name, username, last_name,password } = req.body

  try {
  //email should be valid
   const emailRegex =/^[a-zA-Z0-9.!#$%&'+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)$/
   if (!emailRegex.test(username)){
    return res.status(400).json({ error: 'Enter your Email ID in correct format. Example: abc@xyz.com' })
   }
    // Validation for ID
  if (req.body.id){
    return res.status(400).json({ error: 'Invalid request body for user object: ID cannot be provided by the user' })
  }

  //All four fields should be present
  if (!username ||
    !password ||
    !first_name ||
    !last_name)
    {
      return res.status(400).json({ error: 'username, password, first_name, last_name fields are required in the request body' })
    }
  
    const getUser = await User.findOne({
      where: {
          username: username,
      },
  }).catch((err) => {
    return res.status(500).json({ error: 'Some error occurred while creating the user' })
  })
  if (getUser) {
    return res.status(400).json({ error: 'User already exists!,Please try a different email address' })
  }
  else{
    const salt = await bcrypt.genSalt(10);
    const securedPassword = await bcrypt.hash(password, salt)
    const user = await User.create({first_name, username, last_name,password:securedPassword})
    const userWithoutPassword = {
      id:user.id,
      first_name: user.first_name,
      username: user.username,
      last_name: user.last_name,
      account_updated: user.account_updated,
      account_created: user.account_created
      };
      
      res.status(201).json(userWithoutPassword);
}
  } catch (err) {
    console.log(err)
    return res.status(500).json({ error: 'Some error occurred while creating the user' })
  }
})

//FETCHING USER INFORMATION
app.get('/v1/users/:id',auth ,async (req, res) => {
  if (req.params.id){
        if (req.response.id !== parseInt(req.params.id)) {
            return res.status(403).json({
                message: 'Forbidden Resource'
            }),
                console.log("User not match");
        }
    }
    const id = req.params.id
    try {
      const user = await User.findOne({
        where: { id },
        attributes: {
            exclude: ['password']
        }
         })
         if (!user){
            return res.status(400).json({ error: 'ID NOT PRESENT' })
         }
      return res.json(user)
    } catch (err) {
      console.log(err)
      return res.status(500).json({ error: 'Something went wrong' })
    }
  })


//UPDATING USER
app.put('/v1/users/:id',auth, async (req, res) => {
  if (req.params.id){
    if (req.response.id !== parseInt(req.params.id)) {
        return res.status(403).json({
            message: 'Forbidden Resource'
        }),
            console.log("User not match");
    }
}
    const { first_name, last_name, password,username } = req.body
    
    try {
      
      // req.body is empty
      if (!req.body) {
        return res.status(400).json({ error: 'Request body cant empty' })
      }

      // req.body is present but doesn't have any of
      // first_name, last_name, password, username
      if (!req.body.first_name && !req.body.last_name && !req.body.password && !req.body.username) 
      {
        return res.status(400).json({ error: 'Request body doesnt have any of first_name, last_name, password' })
      }
      // if user_id is not present in the request
      const id = req.params.id;
      if (!id) 
      {
        return res.status(400).json({ error: 'User id is not present in the request' })
      }
       // check if account_created_at is present in the request body
    if (req.body.account_created) {
        return res.status(400).json({ error: 'account_created cant be updated' })
    }
    // check if account_updated_at is present in the request body
    if (req.body.account_updated) {
      return res.status(400).json({ error: 'account_updated cant be updated' })
    }

    var DBUserObj = await User.findByPk(id);
        // check if username is present in the request body
        // if present, verify it matches the username in the db
        if (req.body.username) {
            if (DBUserObj.username !== req.body.username) {
              return res.status(400).json({ error: 'Username cant be updated' })
            }
        }
        // check if id is present in the request body and if it matches the id in the request
        if (req.body.id) {
            if (DBUserObj.id !== req.body.id) {
              return res.status(400).json({ error: 'ID cant be updated' })
            }
        }
      
      const salt = await bcrypt.genSalt(10);
      const securedPassword = await bcrypt.hash(password, salt)
      
      const user = await User.findOne({ where: { id } })
      user.first_name = first_name
      user.last_name = last_name
      user.password = securedPassword
      user.username=username;
  
      await user.save()
  
      return res.status(204).json()
    } catch (err) {
      console.log(err)
      return res.status(500).json({ error: 'Something went wrong' })
    }
  })



//Posting Product Information
  app.post('/v1/product',auth, async(req,res)=>{
    try{
    const owner_user_id=req.response.id
    const { name, description,sku,manufacturer,quantity } = req.body

  // Validation for ID
  if (req.body.id){
    return res.status(400).json({ error: 'Invalid request body for user object: ID cannot be provided by the user' })
  }
  //Validation for date_added,date_last_updated and owner_user_id
  if(req.body.owner_user_id || req.body.date_added || req.body.date_last_updated ){
    return res.status(400).json({ error: 'These properties cant be provided by the user' })
  }
  //Validation for quantity
  if (quantity < 0 || quantity >100 || typeof req.body.quantity === 'string'){
    return res.status(400).json({ error: 'Quantity should be between 0 and 100 and it shouldnt be string' })
  }
  //All four fields should be present
if (!name ||
    !description ||
    !sku ||
    !manufacturer ||
    !quantity)
    {
      return res.status(400).json({ error: 'Name, description,sku,manufacturer,quantity fields are required in the request body' })
    }
    const getProduct = await Product.findOne({
      where: {
          sku: sku,
      },
  })

  if (getProduct) {
    return res.status(400).json({ error: 'Sku already exists!,Please try a different SKU No' })
  }
  else
  {
  const product = await Product.create({name, description,sku,manufacturer,quantity,owner_user_id})
  res.status(201).json(product); 
  }
}
    catch (err) {
      console.log(err)
      return res.status(500).json({ error: 'Some error occurred while creating the Product' })
    }
   })
  

//UPDATING Product Information---PATCH
app.patch('/v1/product/:id', auth, async (req, res) => {
  const id=req.params.id;
  const product = await Product.findOne({ where: { id } })
  if (!product) return res.status(404).send('Product not found');
  
  if (product.owner_user_id.toString() !== req.response.id.toString()) {
    return res.status(401).send('You are not authorized to update this product');
  }

  const { name, description, sku,manufacturer,quantity } = req.body;
  product.name = name;
  product.description = description;
  product.sku = sku;
  product.manufacturer = manufacturer;
  product.quantity = quantity;
  
  try {
  // Validation for ID
  if (req.body.id){
    return res.status(400).json({ error: 'Invalid request body for user object: ID cannot be provided by the user' })
  }
  //Validation for date_added,date_last_updated and owner_user_id
  if(req.body.owner_user_id || req.body.date_added || req.body.date_last_updated ){
    return res.status(400).json({ error: 'These properties cant be provided by the user' })
  }
  //Validation for quantity
  if (quantity < 0 || quantity >100 || typeof req.body.quantity === 'string'){
    return res.status(400).json({ error: 'Quantity should be between 0 and 100 and it shouldnt be string' })
  }
if(sku){
  const getProduct = await Product.findOne({
    where: {
        sku: sku,
    },
})
if (getProduct!==null) {
  return res.status(400).json({ error: 'Sku already exists!,Please try a different SKU No' })
}
}

  await Product.update({ ...req.body },{where: {id},});
    // await product.update(req.body,);
    return res.status(204).json()
}  catch (error) {
    res.status(400).send(error);
  }
});

//UPDATING Product Information--PUT
app.put('/v1/product/:id', auth, async (req, res) => {
  const id=req.params.id;
  const product = await Product.findOne({ where: { id } })
  if (!product) return res.status(404).send('Product not found');
  
  if (product.owner_user_id.toString() !== req.response.id.toString()) {
    return res.status(401).send('You are not authorized to update this product');
  }

  const { name, description, sku,manufacturer,quantity } = req.body;
  product.name = name;
  product.description = description;
  product.sku = sku;
  product.manufacturer = manufacturer;
  product.quantity = quantity;
  
  try {
  // Validation for ID
  if (req.body.id){
    return res.status(400).json({ error: 'Invalid request body for user object: ID cannot be provided by the user' })
  }
  //Validation for date_added,date_last_updated and owner_user_id
  if(req.body.owner_user_id || req.body.date_added || req.body.date_last_updated ){
    return res.status(400).json({ error: 'These properties cant be provided by the user' })
  }
  //Validation for quantity
  if (quantity < 0 || quantity >100 || typeof req.body.quantity === 'string'){
    return res.status(400).json({ error: 'Quantity should be between 0 and 100 and it shouldnt be string' })
  }
//All four fields should be present
 if (!name ||
  !description ||
  !sku ||
  !manufacturer ||
  !quantity)
  {
    return res.status(400).json({ error: 'Name, description,sku,manufacturer,quantity fields are required in the request body' })
  }
  const getProduct = await Product.findOne({
    where: {
        sku: sku,
    },
})

if (getProduct) {
  return res.status(400).json({ error: 'Sku already exists!,Please try a different SKU No' })
}
else{
    await product.save();
    return res.status(204).json()
  } 
}  catch (error) {
    res.status(400).send(error);
  }
});



////Deleting Product Information
app.delete('/v1/product/:id', auth, async (req, res) => {
  try {
    const id=req.params.id;
    const product = await Product.findOne({ where: { id } })
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    // Check if the user who added the product is making the request
    if (product.owner_user_id !== req.response.id) {
      return res.status(401).json({ message: 'Not authorized to delete this product' });
    }
    // Delete the product
    await product.destroy();
    return res.status(204).json()
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
  

//GET PRODUCTS
  app.get('/v1/product/:id',async (req, res) => {
    const id = req.params.id
    try {
      const product = await Product.findOne({
        where: { id }
         })
         if (!product){
            return res.status(400).json({ error: 'ID NOT PRESENT' })
         }
      return res.json(product)
    } catch (err) {
      console.log(err)
      return res.status(500).json({ error: 'Something went wrong' })
    }
  })
   







//Listening 
  app.listen({ port: 8000 }, async () => {
   console.log('Server up on http://localhost:8000')
   await sequelize.authenticate()
   console.log('Database Connected!')
  await sequelize.sync({alter:true});
  
})

module.exports = app;

