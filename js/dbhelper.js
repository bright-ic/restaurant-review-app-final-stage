/**
 * Common database helper functions.
 */
class DBHelper {

  /**
   * Database URL.
   * Change this to restaurants.json file location on your server.
   */
  static get DATABASE_URL() {
    /* const port = 8000 // Change this to your server port
    return `http://localhost:${port}/data/restaurants.json`; */
    const port = 1337 // Change this to your server port
    return `http://localhost:${port}/restaurants`;
  }
  static get DATABASE_REVIEWS_URL() {
    const port = 1337 // Change this to your server port
    return `http://localhost:${port}/reviews`;
  }

  /**
   * Fetch all restaurants.
   */
  static fetchRestaurants(callback) {

    let dbPromise = DBHelper.openIndexDatabase();
    DBHelper.getRestaurantsDataFromIDB(dbPromise, callback); // fetch restaurant details from indexDB(cache)

    //also fetch restaurant details from server and update the page after successful network response
    fetch(DBHelper.DATABASE_URL).then(response =>{
        return response.json();
    }).then(restaurants =>{
        console.log('Restaurant fetched from the server.');
        DBHelper.setRestaurantFetchStatus("server");
        callback(null, restaurants);
    }).catch(err =>{
        const error = (`Request failed. Returned status of ${err}`);
        callback(error, null);
    });

  }

  /**
   * Fetch a restaurant by its ID.
   */
  static fetchRestaurantById(id, callback) {
    let dbPromise = DBHelper.openIndexDatabase();
    DBHelper.getRestaurantByIdFromIDB(dbPromise, callback, id); // fetch restaurant details from indexDB(cache)
    
    //also fetch restaurant details from server and update the page after successful network response
    


    fetch(DBHelper.DATABASE_URL+ `/${id}`).then(response =>{
        return response.json();
    }).then(restaurant =>{
        console.log('Restaurant fetched from the server......');
        DBHelper.setRestaurantFetchStatus("server");
        callback(null, restaurant);
    }).catch(err =>{
        const error = (`Request failed. Returned status of ${err}`);
        callback(error, null);
    });
  }

  /**
   * Fetch restaurants by a cuisine type with proper error handling.
   */
  static fetchRestaurantByCuisine(cuisine, callback) {
    // Fetch all restaurants  with proper error handling
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given cuisine type
        const results = restaurants.filter(r => r.cuisine_type == cuisine);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a neighborhood with proper error handling.
   */
  static fetchRestaurantByNeighborhood(neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given neighborhood
        const results = restaurants.filter(r => r.neighborhood == neighborhood);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a cuisine and a neighborhood with proper error handling.
   */
  static fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        let results = restaurants
        if (cuisine != 'all') { // filter by cuisine
          results = results.filter(r => r.cuisine_type == cuisine);
        }
        if (neighborhood != 'all') { // filter by neighborhood
          results = results.filter(r => r.neighborhood == neighborhood);
        }
        callback(null, results);
      }
    });
  }

  /**
   * Fetch all neighborhoods with proper error handling.
   */
  static fetchNeighborhoods(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all neighborhoods from all restaurants
        const neighborhoods = restaurants.map((v, i) => restaurants[i].neighborhood)
        // Remove duplicates from neighborhoods
        const uniqueNeighborhoods = neighborhoods.filter((v, i) => neighborhoods.indexOf(v) == i)
        callback(null, uniqueNeighborhoods);
      }
    });
  }

  /**
   * Fetch all cuisines with proper error handling.
   */
  static fetchCuisines(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all cuisines from all restaurants
        const cuisines = restaurants.map((v, i) => restaurants[i].cuisine_type)
        // Remove duplicates from cuisines
        const uniqueCuisines = cuisines.filter((v, i) => cuisines.indexOf(v) == i) 
        /* for(const restaurant of restaurants[0])
        {
          console.log(restaurant);
        } */
        callback(null, uniqueCuisines);
      }
    });
  }

  /**
   * Restaurant page URL.
   */
  static urlForRestaurant(restaurant) {
    return (`./restaurant.html?id=${restaurant.id}`);
  }

  /**
   * Restaurant image URL.
   */
  static imageUrlForRestaurant(restaurant) {
    let restaurantPhoto = `/img/${restaurant.photograph}.jpg`;
    if(restaurant.photograph ==="undefined" || restaurant.photograph === undefined){
      restaurantPhoto = `/img/10.jpg`;
    }
    return restaurantPhoto; //(`/img/${restaurant.photograph}.jpg`);
  }

  /**
   * Map marker for a restaurant.
   */
   static mapMarkerForRestaurant(restaurant, map) {
    // https://leafletjs.com/reference-1.3.0.html#marker  
    const marker = new L.marker([restaurant.latlng.lat, restaurant.latlng.lng],
      {title: restaurant.name,
      alt: restaurant.name,
      url: DBHelper.urlForRestaurant(restaurant)
      })
      marker.addTo(newMap);
    return marker;
  } 
  /* static mapMarkerForRestaurant(restaurant, map) {
    const marker = new google.maps.Marker({
      position: restaurant.latlng,
      title: restaurant.name,
      url: DBHelper.urlForRestaurant(restaurant),
      map: map,
      animation: google.maps.Animation.DROP}
    );
    return marker;
  } */

  /* ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
  create/open an indexDB database
  */
  static openIndexDatabase(){
    /* if (!('indexedDB' in window)) {
        console.log('This browser doesn\'t support IndexedDB');
        return Promise.resolve();
      } */
    
      return idb.open('resturant-review-app', 1, upgradeDb => {
            switch(upgradeDb.oldVersion) {
                case 0:
                    upgradeDb.createObjectStore('restaurants');
                case 2:
                    upgradeDb.transaction.objectStore('restaurants').createIndex('id', 'id', {unique: true});
                case 3:
                    upgradeDb.createObjectStore('reviews',{ autoIncrement: true});
                    upgradeDb.createObjectStore('favourites', {keyPath: 'id'});
                    upgradeDb.createObjectStore('pending-reviews', {autoIncrement: true});

            }
    });
    } 

    /* ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
    get restaurant details from idb store
    */
    static getRestaurantsDataFromIDB(dbPromise, callback){
      
      dbPromise.then(db => {
          if (!db) return;
              
          let index = db.transaction('restaurants')
            .objectStore('restaurants').index('id');

          return index.getAll().then( restaurants => { 
              /* check whether restaurant details has been fetched from server yet, 
                if yes don't update the page with details from cache.*/
                if(DBHelper.getRestaurantFetchStatus !=="server"){ // nothing has been returned from server/network
                  DBHelper.setRestaurantFetchStatus("cache");
                  console.log("Restaurant fetched from indexDB store");
                  callback(null, restaurants);
                    //return restaurants;
                }
              return ;//restaurants;
          });
      }).catch(error => {
          const msg = ('Something went wrong: '+ error);
          //console.log(msg);
          callback(msg, null);
      });
    }
    /* ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
    get restaurant details from idb store
    */
   static getRestaurantByIdFromIDB(dbPromise, callback, id){
     console.log('fetching reviews from idb. id: '+ id);
      
    dbPromise.then(db => {
        if (!db) return;
            
        const key = id;
        db.transaction('restaurants','readwrite')
          .objectStore('restaurants').get(key).then( restaurant => {
            if(restaurant) {
            /* check whether restaurant details has been fetched from server yet, 
              if yes don't update the page with details from cache.*/
              if(DBHelper.getRestaurantFetchStatus !=="server"){ // nothing has been returned from server/network
                DBHelper.setRestaurantFetchStatus("cache");
                console.log("Restaurant details fetched from indexDB store.");
                callback(null, restaurant);
                  return restaurant;
              }
            }
            else {
               throw new Error('No restaurant found in local db.');
            }
            return ;//restaurant;
        });
    }).catch(error => {
      const errorMsg = ('Faield: '+ error);
      //console.log(errorMsg);
      callback(errorMsg, null);
    });
  }
    /* ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++ */
    static setRestaurantFetchStatus(status){
      this.fetcheRestaurantFrom = status;
   }
   /* ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++ */
   static get getRestaurantFetchStatus(){
      return this.fetcheRestaurantFrom;
   }
   /* ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++  */
  static postReview(data, callback) {
    let errorMsg='';
    // check users connectivity
       // if(!navigator.onLine) {
          /* user is not online 
          Save data and try sending again.*/
          /* errorMsg = ("Oops! It looks like you have no internet connection.<br>Will auto-retry later, Please don't resend.");
          callback(errorMsg,null);
        } else { */
          //user is online
          fetch(DBHelper.DATABASE_REVIEWS_URL, {
            method: 'POST',
            body: JSON.stringify(data),
            headers : {'Content-Type': 'application/json'}
          }).then(response=> {
              if(!response.ok) {
                throw new Errror('Server failed to respond.');
                return;
              } 
              return response.json();
          }).then(response =>{
              const msg = ("Review submitted successfully:");
              DBHelper.addReviewToDb(data); // add review to idb for offline view.
              callback(null, msg);
          }).catch(err=>{
              //const errorMsg = ("Failed to submit review. error: "+ err);
              errorMsg = ("You are currently offline. Your review post will be automatically submitted when you are online.");
              callback(errorMsg,null);
          })
       // }
        
  }

  /**
   * +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++ 
   * Add a review to idb for offline view
   */
  static addReviewToDb(review) {
    DBHelper.openIndexDatabase().then(db => {
      const store = db.transaction(['reviews'], 'readwrite')
      .objectStore('reviews');
      store.get(review.restaurant_id).then(data => {
        let reviews = review;
        if (data) {
          data.push(review);
          reviews = data;
        }
        store.put(reviews, review.restaurant_id);
        console.log('review added to idb for offline view');
      });
    });
  }
  /* +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++ */
  static saveReviewToIDB(data, callback) {
    DBHelper.openIndexDatabase().then(db => {
      const tx = db.transaction('pending-reviews','readwrite')
                  .objectStore('pending-reviews')
                  .put(data);
      console.log('Saved review while waiting for network connection');
      DBHelper.addReviewToDb(data); // add review to idb for offline view.
      callback(null,'Saved to idb');
    }).catch(err => {
      const errMsg = 'Failed: An error occured and automatic retry failed.';
      console.log(errMsg);
      callback(errMsg, null);
    });
  }
   /* +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++ */
    static retryReviewPost(data, callback){
        if(data) {
            DBHelper.postReview(data, callback); // call to function that post review data
        } else {
            // get data from idb
            DBHelper.openIndexDatabase().then(db => {
                const store = db.transaction('pending-reviews','readwrite')
                              .objectStore('pending-reviews');
                store.getAll().then(data => {
                  if (data.length !== 0) {
                      DBHelper.postReview(data, callback); // call to function that post review data
                  } /* else {
                    callback(null, 'No pending review data was found.');
                  } */
                });
            }).catch(err => {
                callback(null, null);
            })
        }
    }
   /* +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++ */
    /* Clear all pending review data */
    static clearAllPendingReviews() {
        DBHelper.openIndexDatabase().then(db => {
          const store = db.transaction('pending-reviews','readwrite')
                        .objectStore('pending-reviews');
              store.clear();
            
        }).catch(err => {
          console.log('Pending review data removed');
        })
    }
   /* +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++ */
   static fetchRestaurantReviews(id, callback) {
      DBHelper.openIndexDatabase().then(db => {
        const tx = db.transaction('reviews', 'readwrite');
        const store = tx.objectStore('reviews');
        store.get(id).then(data => {
          if (data) {
            let pendingReview = '';
           // DBHelper.fetchPendingReviews(id, callback)
            callback(null, data);
            // If newer reviews are available from server, fetch, display and add to IDB for offline view.
            DBHelper.fetchReviewsFromServerAndAddToDB(id, callback);
          } else {
            DBHelper.fetchReviewsFromServerAndAddToDB(id, callback);
          }
        })
      }).catch(err => {
        // something went wrong with idb, fetch directly from the server.
        DBHelper.fetchReviewsFromServerAndAddToDB(id, callback);
      });
    }
  /**
   * +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
   * fetch pending review from idb for offline view
   */
  static fetchPendingReviews(id, callback) {
    DBHelper.openIndexDatabase().then(db => {
      const tx = db.transaction('reviews', 'readwrite');
      const store = tx.objectStore('reviews');
      store.get(id).then(data => {
        if (data) {
          console.log(data[0]);
          callback(data[0]);
        } 
      })
    });
  }
  /* +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++ */
  static fetchReviewsFromServerAndAddToDB(id, callback) {
      fetch(DBHelper.DATABASE_REVIEWS_URL + `/?restaurant_id=${id}`)
      .then(function(response) {
        return response.json();
      })
      .then(function(reviews) {
          DBHelper.openIndexDatabase().then(db => {
          const tx = db.transaction(['reviews'], 'readwrite');
          const store = tx.objectStore('reviews');
          store.delete(id);
          store.put(reviews, id);
        });
        callback(null, reviews);
      })
      .catch(error => {
        const errorResponse = (`Failed: Could not fetch review(s) for restaurant id: ${id}: error: ${error}`);
        //console.log(errorResponse);
        callback(errorResponse, null);
      });
  }
/* +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++ */
  static createFavoriteButton(restaurant) {
    const favorite = document.createElement('button');
      favorite.classList.add('fav-star');
      favorite.setAttribute('tabindex', '0');
      favorite.setAttribute('role', 'button');
      
      if (restaurant.is_favorite === 'true') {
        favorite.innerHTML = '&#9733';
        favorite.setAttribute('aria-label', `Unmark ${restaurant.name} as favorite`);
        favorite.classList.add('marked-favorite');
        favorite.setAttribute('title', 'Unmark as favorite');
      } else {
        favorite.innerHTML = '&#9734';
        favorite.setAttribute('aria-label', `Mark ${restaurant.name} as favorite`);
        favorite.classList.remove('marked-favorite');
        favorite.setAttribute('title', 'Mark as favorite');
      }
      // add click event listener to favorite button
      favorite.addEventListener('click', (event) => {
           DBHelper.toggleFavorite(restaurant, (error, response) => {
            if (error) {
              console.error(error);
            } else {
              restaurant.is_favorite = response.is_favorite;
              if (response.is_favorite === 'true') {
                favorite.innerHTML = '&#9733';
                favorite.setAttribute('aria-label', `Unmark ${restaurant.name} as favorites`);
                favorite.classList.add('marked-favorite');
                favorite.setAttribute('title', 'Unmark as favorite');
              } else {
                favorite.innerHTML = '&#9734';
                favorite.setAttribute('aria-label', `Mark ${restaurant.name} as favorites`);
                favorite.classList.remove('marked-favorite');
                favorite.setAttribute('title', 'Mark as favorite');
              }
            }
          });
      });
  
      return favorite;
  }
/* ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++ */
  // Update favorite status in the  idb.
  static updateFavorite(restaurant) {
    DBHelper.openIndexDatabase().then(db => {
      const store = db.transaction(['restaurants'], 'readwrite')
      .objectStore('restaurants');
      store.put(restaurant, restaurant.id);
    });
  }
/* ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++ */
  //Fetch pending favorites
  static pendingFavorite(id, callback) {
    DBHelper.openIndexDatabase().then(function(db) {
      const store = db.transaction(['favourites'], 'readwrite')
      .objectStore('favourites');
      store.get(id).then(function(favData) {
        if (favData) {
          store.delete(id);
          callback(null, favData);
        } else {
          callback(null, null);
        }
      })
      .catch(error => {
        callback(error, null);
      })
    });
  }
  /* ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++ */
  // Toggle Restaurant as favorite or not
  static toggleFavorite(restaurant, callback) {
    const url = `${DBHelper.DATABASE_URL}/${restaurant.id}/?${restaurant.is_favorite === 'true' ? 'is_favorite=false' : 'is_favorite=true'}`
    fetch(url, {method: 'PUT'})
    .then(response => response.json())
    .then(resp => {
        DBHelper.updateFavorite(resp);
        callback(null, resp);
    })
    .catch(error => {
        DBHelper.openIndexDatabase().then(db => {
          const tx = db.transaction(['favourites'], 'readwrite');
          const store = tx.objectStore('favourites');
          store.get(restaurant.id).then(favData => {
            if (favData) {
              store.delete(restaurant.id);
            } else {
              store.put({
                id: restaurant.id,
                favorite: restaurant.is_favorite === 'true' ? true : false
              });
            }
          });
      });
      callback(error, null);
    });
  }

}