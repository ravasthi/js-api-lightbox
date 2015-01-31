var APILightbox = window.APILightbox ? window.APILightbox : {};

// function called by eval-ing response from Flickr
function jsonFlickrApi(response) {
  if(response.stat == 'ok') {
    APILightbox.populateResults(response);
  }
}

APILightbox = {
  flickrApiKey:      '7b491816b7ce18f1f848e52962352ee7',
  flickrRestUrlBase: 'https://www.flickr.com/services/rest/',
  searchText:        'delphinium',
  currentPhotoIndex: 0,
  maxPhotoIndex:     24,
  photos:            {},

  utils: {
    ajax: function(method, url, data, callback) {
      var xhr = new XMLHttpRequest();
      xhr.onreadystatechange = readystatechange;
      xhr.open(method, url);
      xhr.send(data && JSON.stringify(data));

      function readystatechange() {
        if(xhr.readyState == xhr.DONE) {
          if(xhr.status == 200) {
            callback(xhr.status, xhr.response);
          } else {
            callback(xhr.status, null);
          }
        }
      }
    },

    buildUrlParams: function(options) {
      var params = "?";
      for(var key in options) {
        value = options[key];

        if(typeof key == "string" && typeof value == "string") {
          params += key + "=" + value + "&";
        }
      }
      // Remove that extraneous last '&'
      params = params.replace(/&$/, '');

      return params;
    },

    buildFlickrOptions: function(options) {
      options = options ? options : {};

      options.format = 'json';
      options.api_key = APILightbox.flickrApiKey;

      return options;
    },

    buildFlickrPhotoUrl: function(photo) {
      /*
      ** Flickr photo urls take the following format:
      **
      ** https://farm{farm-id}.staticflickr.com/{server-id}/{id}_{secret}_{size}.jpg
      */

      return "https://farm" + photo.farm +
             ".staticflickr.com/" + photo.server + "/" +
             photo.id + "_" + photo.secret + "_" + "c.jpg";
    }
  },

  getImages: function(searchText, maxCount) {
    var flickrMaxCountPerPage = 500;

    if(maxCount && typeof (maxCount * 1) == 'number' &&
       maxCount <= flickrMaxCountPerPage &&
       maxCount != APILightbox.maxPhotoIndex + 1) {
      APILightbox.maxPhotoIndex = maxCount;
    }

    if(searchText && typeof searchText == 'string') {
      APILightbox.searchText = searchText;
    }

    var flickrOptions = {
      method:   'flickr.photos.search',
      text:     searchText ? searchText : APILightbox.searchText,
      page:     1,
      per_page: maxCount ? maxCount : APILightbox.maxPhotoIndex + 1,
      media:    'photos'
    };

    flickrOptions = APILightbox.utils.buildFlickrOptions(flickrOptions);

    var url = APILightbox.flickrRestUrlBase;

    url += APILightbox.utils.buildUrlParams(flickrOptions);

    APILightbox.utils.ajax('get', url, null, function(status, response) {
      if(status == 200) {
        eval(response);
      }
    });
  },

  populateResults: function(response) {
    APILightbox.photos = response.photos;
    APILightbox.showImage(0, response.photos);

    var searchString = document.querySelectorAll('h1 .search-string')[0];
    var previous = document.querySelectorAll('.lightbox .paging-controls .previous')[0];
    var next = document.querySelectorAll('.lightbox .paging-controls .next')[0];

    searchString.innerText = APILightbox.searchText;
    previous.addEventListener('click', APILightbox.showPreviousImage, false);
    next.addEventListener('click', APILightbox.showNextImage, false);
  },

  showImage: function(index) {
    var title = document.querySelectorAll('.lightbox .title')[0];
    var image = document.querySelectorAll('.response .photo')[0];

    APILightbox.currentPhotoIndex = index;
    photo                         = APILightbox.photos.photo[index];
    title.innerText               = photo.title;
    image.src                     = APILightbox.utils.buildFlickrPhotoUrl(photo);
  },

  showPreviousImage: function() {
    var previousIndex = APILightbox.currentPhotoIndex - 1;
    if(previousIndex < 0) previousIndex = APILightbox.maxPhotoIndex;

    APILightbox.showImage(previousIndex);
  },

  showNextImage: function() {
    var nextIndex = APILightbox.currentPhotoIndex + 1;
    if(nextIndex > APILightbox.maxPhotoIndex) nextIndex = 0;

    APILightbox.showImage(nextIndex);
  }
};
