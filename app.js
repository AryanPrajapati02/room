const express = require("express");
const app = express();
const mongoose = require("mongoose");
const Listing = require("./models/listing.js");
const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const wrapAsync =require("./utils/wrapAsync.js")
const ExpressError = require("./utils/ExpressError.js")
// const {listingSchema , reviewSchema} = require("./schema.js")
const Review = require("./models/review.js")

app.use(express.static(path.join(__dirname, "/public")))
app.engine("ejs" , ejsMate)


const MONGO_URL = "mongodb://127.0.0.1:27017/roombook";
// const MONGO_URL = process.env.DB_URI;


main()
  .then(() => {
    console.log("connected to DB");
  })
  .catch((err) => {
    console.log(err);
  });

async function main() {
  await mongoose.connect(MONGO_URL);
}

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({ extended: true })); //id ke liye
app.use(methodOverride("_method"));


// const validateListing =(req ,res, next)=>{
//   let {error} = listingSchema.validate(req.body)
//   if (error){
//     let msg = error.details.map(el => el.message).join(",")
//     throw new ExpressError(msg , 400)
//   } else{
//     next()
//   }
// }

// const validateReview =(req ,res, next)=>{
//   let {error} = reviewSchema.validate(req.body)
//   if (error){
//     let msg = error.details.map(el => el.message).join(",")
//     throw new ExpressError(msg , 400)
//   } else{
//     next()
//   }
// }



app.get("/", (req, res) => {
  res.render("home.ejs");
});


//index route

app.get("/listings" ,wrapAsync( async (req , res)=>{
  const allListings = await  Listing.find({})
 
  res.render("listings/index.ejs" , {allListings})
})
)
app.get("/listings/new" , wrapAsync((req , res)=>{
  res.render("listings/new.ejs")
  
}))
app.post("/listings" , wrapAsync(async (req , res ,next)=>{
  
  // let result = listingSchema.validate(req.body)
  // if(result.error){
  //   throw new ExpressError(result.error.message , 400)
  // }
  const newListing = new Listing(req.body.listing)
  await newListing.save()
  
  res.redirect("/listings")
 
 
}))

app.get("/listings/:id" ,wrapAsync(async (req , res)=>{
  const {id} = req.params;
  const listing = await Listing.findById(id).populate("reviews");
  res.render("listings/show.ejs" , {listing})
})
)
app.get("/listings/:id/edit" , wrapAsync(async (req , res)=>{
  const {id} = req.params;
  const listing = await Listing.findById(id);
  res.render("listings/edit.ejs" , {listing})
}))

app.put("/listings/:id" ,wrapAsync( async (req , res)=>{
  if(!req.body.listing){
    throw new ExpressError("Invalid Listing Data" , 400)
  }
  const {id} = req.params;
  await Listing.findByIdAndUpdate(id , {...req.body.listing})
  console.log("updated")
  res.redirect(`/listings/${id}`)
}))

app.delete("/listings/:id" ,wrapAsync(async (req , res)=>{
  const {id} = req.params;
  await Listing.findByIdAndDelete(id)
  console.log("deleted")
  res.redirect("/listings")
})
)
app.post("/listings/:id/reviews" , wrapAsync( async (req , res)=>{
  const {id} = req.params;
  const listing = await Listing.findById(id)
 let newReview = new Review(req.body.review)
  listing.reviews.push(newReview)
 await newReview.save()
  await listing.save()
  //res.json(review)
 console.log("new review saves")
 res.redirect(`/listings/${id}`)

  
}))
app.delete("/listings/:id/reviews/:reviewId" , wrapAsync(async (req , res)=>{
  const {id , reviewId} = req.params;
  await Listing.findByIdAndUpdate(id , {$pull:{reviews:reviewId}})
  await Review.findByIdAndDelete(reviewId)
  res.redirect(`/listings/${id}`)
})
)

app.use((req , res , next)=>{
  next(new ExpressError("Page Not Found" , 404))
})
app.use((err , req, res , next)=>{
  let{
    status = 500,
    message = "Something went wrong"
  } = err;
  
  res.render("error.ejs" , {err});
})




app.listen(8080, () => {
  console.log("server is listening to port 8080");
});