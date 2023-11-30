const express=require('express')
const {check}=require('express-validator')
const router =express.Router();

const PlacesControllers=require('../controllers/places-controllers')

router.get('/:pid',PlacesControllers.getPlaceById)

router.get('/user/:uid',PlacesControllers.getPlaceByUserId)

router.post('/',[
    check("title")
    .not()
    .isEmpty(),
    check('description').isLength({min:5}),
    check('address')
    .not()
    .isEmpty()
    ],
    PlacesControllers.createPlace)

router.patch('/:pid',[ 
    check("title")
    .not()
    .isEmpty(),
    check('description').
    isLength({min:5})],
    PlacesControllers.updatePlaceById)

router.delete('/:pid',PlacesControllers.deletePlaceById)

//     const userId=req.params.pid;
//     const place=SOME_PLACES.find(p=>{
//       return p.creator===userId
//     })
//    // console.log('Get request in user')

//    if(!place){
//       return res
//          .status(404)
//          .json({message:'could not find a place for the provided ID'})
//    }
//      res.json({place})
   

// })

module.exports=router 