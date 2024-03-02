const express = require("express");
const cors = require("cors");
const bcrypt = require("bcrypt");
const { MongoClient, ObjectId } = require("mongodb");
require("dotenv").config();
const jwt = require("jsonwebtoken");



const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection URL
const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);

const verifyUser = (req, res, next) =>{
  const authorization = req.headers.authorization;
  if (!authorization) {
  return  res.status(401).send({success: false, message: 'unauthorized Access' })
  }
  const token = authorization
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).send({success: false, message: 'unauthorized access'})
    }
    req.decoded = decoded;
    next()
  })
}
async function run() {
  try {
    // Connect to MongoDB
    await client.connect();
    console.log("Connected to MongoDB");

    const db = client.db("assignment");
    const collection = db.collection("users");
    const postCollection = db.collection("posts");
    const donorsCollection = db.collection("donors");
    const volunteerCollection = db.collection("volunteers");
    const TestimonialsCollection = db.collection("testimonials")
    const commentCollection = db.collection("comments")

    // User Registration
    app.post("/api/v1/register", async (req, res) => {
      const { name, email, password,image } = req.body;
 
      // Check if email already exists
      const existingUser = await collection.findOne({ email });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: "User already exists",
        });
      }

      // Hash the password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Insert user into the database
      await collection.insertOne({ name, email, password: hashedPassword ,image});

      res.status(201).json({
        success: true,
        message: "User registered successfully",
      });
    });

    // User Login
    app.post("/api/v1/login", async (req, res) => {
      const { email, password } = req.body;

      // Find user by email
      const user = await collection.findOne({ email });
      if (!user) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      // Compare hashed password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      // Generate JWT token
      const token = jwt.sign({ email: user.email }, process.env.JWT_SECRET, {
        expiresIn: process.env.EXPIRES_IN,
      });

   

      res.json({
        success: true,
        message: "Login successful",
        token,
      });
    });

    // ==============================================================
       // get user 
       app.get("/api/v1/user/:email", async (req, res) => {
        try {
          const { email } = req.params
          const user = await collection.findOne({ email });
          res.status(200).json({
            success: true,
            message: "User retrieved successfully",
            data: user,
          });
        } catch (error) {
          res.status(500).json({
            success: false,
            message: "Something went wrong!",
          });
        }
      })
    // add -post
    app.post("/api/v1/add-post",verifyUser, async (req, res) => {
      try {
       
        const result = await postCollection.insertOne(req.body);
      
        res.status(201).json({
          success: true,
          message: "Post added successfully",
          data: result,
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          message: "Something went wrong!",
        });
      }
    });

    // get all post
    app.get("/api/v1/all-post", async (req, res) => {
      try {
        const result = await postCollection.find().toArray();

        if (result) {
          res.status(200).json({
            success: true,
            message: "Posts retrieved successfully",
            data: result,
          });
        } else {
          res.status(404).json({
            success: false,
            message: "No posts found",
            data: [],
          });
        }
      } catch (error) {
     
        res.status(500).json({
          success: false,
          message: "Something went wrong!",
        });
      }
    });
    // get single post
    app.get("/api/v1/post/:id", async (req, res) => {
      try {
        const {id} =req.params
        const result = await postCollection.findOne({_id: new ObjectId(id)})

        if (result) {
          res.status(200).json({
            success: true,
            message: "Post retrieved successfully",
            data: result,
          });
        } else {
          res.status(404).json({
            success: false,
            message: "No posts found",
            data: null,
          });
        }
      } catch (error) {
    
        res.status(500).json({
          success: false,
          message: "Something went wrong!",
        });
      }
    });
    
    // get delete post
    app.delete("/api/v1/delete-post/:id",verifyUser, async (req, res) => {
      try {
        const {id} =req.params
        const result = await postCollection.findOne({_id: new ObjectId(id)})

        if (!result) {
         return res.status(404).json({
            success: false,
            message: "No posts found",
            data: null,
          });
        }
        await postCollection.findOneAndDelete({_id: new ObjectId(id)})

        res.status(200).json({
         success: true,
         message: "Post deleted successfully",
         data: null,
       })
      } catch (error) {
 
        res.status(500).json({
          success: false,
          message: "Something went wrong!",
        });
      }
    });
    // update post
    app.patch("/api/v1/update-post/:id",verifyUser, async (req, res) => {
      try {
        const {id} =req.params
        const {image, title, category, qty, description} = req.body
        const result = await postCollection.findOne({_id: new ObjectId(id)})

        if (!result) {
         return res.status(404).json({
            success: false,
            message: "No posts found",
            data: null,
          });
        }
        const updatePost = {$set: {
          image: image, 
          title: title,
          category: category,
          qty: qty,
          description: description
        }}
        await postCollection.findOneAndUpdate({_id: new ObjectId(id)}, updatePost)

        res.status(200).json({
         success: true,
         message: "Post updated successfully",
         data: null,
       })
      } catch (error) {
        
        res.status(500).json({
          success: false,
          message: "Something went wrong!",
        });
      }
    });

    // add donors 
    app.post("/api/v1/add-donor", async (req, res) => {
      try {
       
        const result = await donorsCollection.insertOne(req.body);
      
        res.status(201).json({
          success: true,
          message: "Donor added successfully",
          data: result,
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          message: "Something went wrong!",
        });
      }
    });

    // get all donors
      app.get("/api/v1/all-donor", async (req, res) => {
   
          try {
            const result = await donorsCollection.find().sort({ totalAmount: -1 }).toArray();
    
            if (result.length > 0) {
                res.status(200).json({
                    success: true,
                    message: "Donors retrieved successfully",
                    data: result,
                });
            } else {
                res.status(404).json({
                    success: false,
                    message: "No donors found",
                    data: [],
                });
            }
        } catch (error) {
            res.status(500).json({
                success: false,
                message: "Something went wrong!",
            });
        }
      });

          // get single donor
    app.get("/api/v1/donor/:email", async (req, res) => {
      try {
        const {email} =req.params
        const result = await donorsCollection.findOne({email})

        if (result) {
          res.status(200).json({
            success: true,
            message: "Donor retrieved successfully",
            data: result,
          });
        } else {
          res.status(404).json({
            success: false,
            message: "No donor found",
            data: null,
          });
        }
      } catch (error) {
    
        res.status(500).json({
          success: false,
          message: "Something went wrong!",
        });
      }
    });
    // update donor amount
    app.patch("/api/v1/update-donate-amount/:email", async (req, res) => {
      try {
        const {email} =req.params
        const {totalAmount, post} = req.body
        console.log(totalAmount)
        const result = await donorsCollection.findOne({email:email})

        if (!result) {
         return res.status(404).json({
            success: false,
            message: "No donor found",
            data: null,
          });
        }
        const updateAmount = {$set: {
          totalAmount: totalAmount,
          post: [...result.post, post]
        }}
        await donorsCollection.findOneAndUpdate({email:email}, updateAmount)

        res.status(200).json({
         success: true,
         message: "Donation successfully",
         data: null,
       })
      } catch (error) {
        console.log(error)
        res.status(500).json({
          success: false,
          message: "Something went wrong!",
        });
      }
    });

    //   Join as Volunteer

    app.post("/api/v1/add-volunteer", async (req, res) => {
      try {
       
        const result = await volunteerCollection.insertOne(req.body);
      
        res.status(201).json({
          success: true,
          message: "Volunteer added successfully",
          data: result,
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          message: "Something went wrong!",
        });
      }
    });

      // get all volunteer
      app.get("/api/v1/all-volunteer", async (req, res) => {
   
        try {
          const result = await volunteerCollection.find().sort({ totalAmount: -1 }).toArray();
  
          if (result.length > 0) {
              res.status(200).json({
                  success: true,
                  message: "Volunteer retrieved successfully",
                  data: result,
              });
          } else {
              res.status(404).json({
                  success: false,
                  message: "No Volunteer found",
                  data: [],
              });
          }
      } catch (error) {
          res.status(500).json({
              success: false,
              message: "Something went wrong!",
          });
      }
    });

    
    // add Testimonials 
    app.post("/api/v1/add-testimonials", async (req, res) => {
      try {
        const result = await TestimonialsCollection.insertOne(req.body);
        res.status(201).json({
          success: true,
          message: "Testimonials added successfully",
          data: result,
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          message: "Something went wrong!",
        });
      }
    });

    // get testimonials by post id 
    app.get("/api/v1/all-testimonials/:id", async (req, res) => {
      try {
        const {id} =req.params
        console.log(id)
        const result = await TestimonialsCollection.find({ postId: id }).toArray();

        if (result) {
          res.status(200).json({
            success: true,
            message: "Testimonials retrieved successfully",
            data: result,
          });
        } else {
          res.status(404).json({
            success: false,
            message: "No testimonials found",
            data: null,
          });
        }
      } catch (error) {
    
        res.status(500).json({
          success: false,
          message: "Something went wrong!",
        });
      }
    });

    // add Comment 
    app.post("/api/v1/add-comment", async (req, res) => {
      try {
        const result = await commentCollection.insertOne(req.body);
        res.status(201).json({
          success: true,
          message: "Comment post successfully",
          data: result,
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          message: "Something went wrong!",
        });
      }
    });

    // get all comments
    app.get("/api/v1/all-comments", async (req, res) => {
      try {
    
        const result = await commentCollection.find().toArray();

        if (result) {
          res.status(200).json({
            success: true,
            message: "Comments retrieved successfully",
            data: result,
          });
        } else {
          res.status(404).json({
            success: false,
            message: "No comments found",
            data: null,
          });
        }
      } catch (error) {
    
        res.status(500).json({
          success: false,
          message: "Something went wrong!",
        });
      }
    });
    // ==============================================================

    // Start the server
    app.listen(port, () => {
      console.log(`Server is running on http://localhost:${port}`);
    });
  } finally {
  }
}

run().catch(console.dir);

// Test route
app.get("/", (req, res) => {
  const serverStatus = {
    message: "Server is running smoothly",
    timestamp: new Date(),
  };
  res.json(serverStatus);
});
