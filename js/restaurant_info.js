let myRestaurant = '';
let RrestaurantReviews = '';
var newMap;

if(window.Worker) {
  console.log('Web worker is supported.');
  myWebWorker = new Worker('js/webworker.js');
}
else {
  console.log('worker is not supported');
}
/**
 * Initialize map as soon as the page is loaded.
 */
document.addEventListener('DOMContentLoaded', async (event) => {  
  await initMap();
  myWebWorker.postMessage('retryPostingFailedReviews');
});

/**
 * Initialize leaflet map
 */
initMap = () => {
  fetchRestaurantFromURL((error, restaurant) => {
     if (error) { // Got an error!
      console.error(error);
    } else {      
      self.newMap = L.map('map', {
        center: [restaurant.latlng.lat, restaurant.latlng.lng],
        zoom: 16,
        scrollWheelZoom: false
      });
      L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.jpg70?access_token={mapboxToken}', {
        mapboxToken: 'sk.eyJ1Ijoib253dWt3ZWIiLCJhIjoiY2praTc0NXdwMHoxaDNwanlxMm80Nm5zNCJ9.Qf8eZWPS4RTAhoXremQeKQ',
        maxZoom: 18,
        attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, ' +
          '<a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
          'Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
        id: 'mapbox.streets'    
      }).addTo(newMap);
      fillBreadcrumb();
      DBHelper.mapMarkerForRestaurant(self.restaurant, self.newMap);

    }
  }); 
}  

/* window.initMap = () => {
  fetchRestaurantFromURL((error, restaurant) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      self.map = new google.maps.Map(document.getElementById('map'), {
        zoom: 16,
        center: restaurant.latlng,
        scrollwheel: false
      });
      fillBreadcrumb();
      DBHelper.mapMarkerForRestaurant(self.restaurant, self.map);
    }
  });
} */

/**
 * Get current restaurant from page URL.
 */
fetchRestaurantFromURL = async (callback) => {
  
  if (self.restaurant) { // restaurant already fetched!
    callback(null, self.restaurant)
    return;
  }
  const id = getParameterByName('id');
  if (!id) { // no id found in URL
    error = 'No restaurant id in URL'
    callback(error, null);
  } else {
    // get restaurant detail from server
     await DBHelper.fetchRestaurantById(id, (error, restaurant) => {
      if (!restaurant) {
        console.error(error);
        return;
      }
      self.restaurant = restaurant;
      if (!self.restaurant.reviews) {
        restaurant.reviews = DBHelper.fetchRestaurantReviews(self.restaurant.id, (error, reviews) => {
          if (!error) {
            self.restaurant.reviews = reviews;
            // fill reviews
            fillReviewsHTML();
          }
        });
      }
      fillRestaurantHTML();
      callback(null, restaurant);
    }); 
  }
}

/**
 * Create restaurant HTML and add it to the webpage
 */
fillRestaurantHTML = (restaurant = self.restaurant) => {
  //restaurant = myRestaurant;
  const name = document.getElementById('restaurant-name');
  name.innerHTML = restaurant.name;

  const address = document.getElementById('restaurant-address');
  address.innerHTML = restaurant.address;
  const btnFavorite = DBHelper.createFavoriteButton(restaurant);
  address.appendChild(btnFavorite);

  let imgPath = DBHelper.imageUrlForRestaurant(restaurant);
  const imgPath_1x = imgPath.replace(/(\.[\w\d_-]+)$/i, '_1x$1'); // get the small resolution of the image
  const image = document.getElementById('restaurant-img');
  image.className = 'review-restaurant-img';
  image.src = imgPath_1x;
  image.srcset = imgPath_1x + " 400w," + imgPath + " 800w";
  //image.sizes = "(max-width: 700px) 80vw, 33vw";
  image.alt = restaurant.name;

  const cuisine = document.getElementById('restaurant-cuisine');
  cuisine.innerHTML = restaurant.cuisine_type;

  // fill operating hours
  if (restaurant.operating_hours) {
    requestAnimationFrame(fillRestaurantHoursHTML) ;
  }
}

/**
 * Create restaurant operating hours HTML table and add it to the webpage.
 */
fillRestaurantHoursHTML = (operatingHours = self.restaurant.operating_hours) => {
  const hours = document.getElementById('restaurant-hours');
  for (let key in operatingHours) {
    const row = document.createElement('tr');

    const day = document.createElement('td');
    day.innerHTML = key;
    row.appendChild(day);

    const time = document.createElement('td');
    time.innerHTML = operatingHours[key];
    row.appendChild(time);

    hours.appendChild(row);
  }
}

/**
 * Create all reviews HTML and add them to the webpage.
 */
fillReviewsHTML = (reviews = self.restaurant.reviews) => {
  const container = document.getElementById('reviews-container');

  if (!reviews) {
    const noReviews = document.createElement('p');
    noReviews.innerHTML = 'No reviews yet!';
    container.appendChild(noReviews);
    return;
  }
  const ul = document.getElementById('reviews-list');
  ul.innerHTML = ''; //Remove previously loaded reviews
  //console.log(RrestaurantReviews);
  reviews.forEach(review => {
    ul.appendChild(createReviewHTML(review));
  });
  container.appendChild(ul);
}

/**
 * Create review HTML and add it to the webpage.
 */
createReviewHTML = (review) => {
  const li = document.createElement('li');
  li.setAttribute('role', 'listitem');
  li.classList.add('each-review-container');
  li.tabIndex = 0;
  const name = document.createElement('p');
  name.innerHTML = review.name;
  //name.tabIndex = "0";
  if (review.updatedAt) {
    const date = document.createElement('label');
    date.innerHTML = `Posted on ${new Date(review.updatedAt).toDateString()}`;
    date.classList.add('review-date');
    name.appendChild(date);
  }
  name.classList.add('review-head');
  li.appendChild(name);

  const rating = document.createElement('p');
  //rating.tabIndex = "0";
  rating.innerHTML = `Rating: ${review.rating}`;
  li.appendChild(rating);

  const comments = document.createElement('p');
  comments.tabIndex = "0";
  comments.innerHTML = review.comments;
  //comments.style.textAlign = 'justify';
  li.appendChild(comments);

  return li;
}

/**
 * Add restaurant name to the breadcrumb navigation menu
 */
fillBreadcrumb = (restaurant=self.restaurant) => {
  //restaurant = myRestaurant;
  const breadcrumb = document.getElementById('breadcrumb');
  const li = document.createElement('li');
  li.tabIndex =0;
  li.innerHTML = restaurant.name;
  breadcrumb.appendChild(li);
}

/**
 * Get a parameter by name from page URL.
 */
getParameterByName = (name, url) => {
  if (!url)
    url = window.location.href;
  name = name.replace(/[\[\]]/g, '\\$&');
  const regex = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`),
    results = regex.exec(url);
  if (!results)
    return null;
  if (!results[2])
    return '';
  return decodeURIComponent(results[2].replace(/\+/g, ' '));
}
/* ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++ */
/* Submit user review */
submitReview = (submitButton)=> {
  let msg = "";
  showMsg('review-form-alert-container', 'Submitting...');
  let isValidated = false;
  const reviewersName = document.getElementById('name').value;
  const rating = document.getElementById('review-rating').value;
  const comment = document.getElementById('comment').value;

  // validation
  if(reviewersName === "") {
    msg = "Name field must not be empty.";
  }
  else if(rating === "" || rating < 0 || rating > 5) {
    msg = "Invalid rate. (expected values: 1,2,3,4 or 5)";
  }
  else if(comment === "") {
    msg = "Please add comment.";
  }
  else {
    isValidated = true;
  }

  if(isValidated) {
      /* All validations returned true
          Go ahead and send to server */

      const restaurant_id = self.restaurant.id;
      if (!restaurant_id) { // no id found in URL
        console.log('No restaurant id in URL');
      } 
      else {
          data = {
              "restaurant_id": restaurant_id,
              "name": reviewersName,
              "rating": rating,
              "comments": comment
          };
          let errorMsg, successMsg, error, success;
          submitButton.setAttribute('value', 'Submitting...'); // change the value of the submit button
          //submitButton.disabled = true; // disable the submit button
          // submit data to server
          DBHelper.postReview(data, (errorMsg, successMsg) => {
            if(errorMsg){
              // failed to post review to server
              DBHelper.saveReviewToIDB(data, (error, success) =>{
                  if(error) { // failed to save to idb,.\\. Retry after 5 munites
                      showMsg('review-form-alert-container', error, "error");
                      //setTimeout(retryPostingFailedReview(data), 3000000); // retry in 5 munites
                  } else{
                    // review was saved to idb.
                    showMsg('review-form-alert-container', errorMsg, "error");
                    //setTimeout(retryPostingFailedReview(data), 3000000); // retry in 5 munites
                  }
              });
            } else{
              showMsg('review-form-alert-container', successMsg);
            }
            //submitButton.disabled = true; // enable the submit button
            submitButton.setAttribute('value', '    Submit    '); // change the value of the submit button back
          });
      }
  } else {
      showMsg('review-form-alert-container', msg);
  }
  return false;
}
/* ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++ */
// Try posting failed review post on network recovery
retryPostingFailedReview = (data='') => {
  console.log('Retrying data posting');
    DBHelper.retryReviewPost(data, (error, success) =>{
      if(error) { // failed to save to idb,.\\. Retry after 5 munites
          showMsg('review-form-alert-container', error, "error");
          console.log('Retrying posting pending review data later.');
          //setTimeout(retryPostingFailedReview(data), 3000000); // retry in 5 munites
      } else{
          // review was submitted successfully.
          if(success) {
            showMsg('review-form-alert-container', success);
            DBHelper.clearAllPendingReviews(); // remove pending review data from idb
          }
      }
    });
}
/* ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++ */
showMsg = (elementID, msg, msgType='') => {
  let  reviewAlert = document.getElementById(elementID);
  if(msgType === "error"){
    reviewAlert.style.color = "red";
    reviewAlert.innerHTML = msg;
  }
  else {
    reviewAlert.style.color = "green";
    reviewAlert.innerHTML = msg;
  }
  return;
}

/* ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++ */
clearMsg = (elementID) => {
  document.getElementById(elementID).innerHTML = '';
  return;
}
/* ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++ */
/* Listen and add event handler that handles data received from web worker. */
myWebWorker.addEventListener('message', function(e) {
    const response = e.data;

    // response from web worker for retried review posting.
    if(response.ops === "retyReviewPosting") {
      handleReviewPostRetry(response);
    }
}); 
/* +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++ */
handleReviewPostRetry = (response) => {
  if(response.error) {
    showMsg('review-form-alert-container', response.msg, 'error');
    console.error(response.msg);
    return;
  }
  showMsg('review-form-alert-container', response.msg);
}
/* ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++ */