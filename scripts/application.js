var APILightbox = window.APILightbox ? window.APILightbox : {};

APILightbox = {
  flickrApiKey:      '7b491816b7ce18f1f848e52962352ee7',
  flickrRestUrlBase: 'https://www.flickr.com/services/rest/',
  searchText:        'delphinium',
  currentPhotoIndex: 0,
  maxPhotoIndex:     24,
  photos:            {},

  utils: {
    hide: function(element) {
      element.className = element.className.replace(/\sshow/i, '');
      element.className += ' hide';
    },

    show: function(element, height) {
      element.className = element.className.replace(/\shide/i, '');
      element.className += ' show';
      element.style     = "height: " + height + ";";
    },

    sanitizeInput: function(string) {
      danger = [
        /<script[^>]*?>.*?<\/script>/gi, // Strip out javascript
        /<style[^>]*?>.*?<\/style>/gi,   // Strip style tags
        /<![\s\S]*?--[ \t\n\r]*>/gi,     // Strip multi-line comments
        /<[\/\!]*?[^<>]*?>/gi            // Strip out HTML tags
      ];

      for(var i = 0; i < danger.length; i++) {
        string = string.replace(danger[i], '');
      }

      // Also collapse multiple spaces down to one
      string = string.replace(/\s+/, ' ');

      return string;
    },

    ajax: function(method, url, data, callback, type) {
      var xhr                = new XMLHttpRequest();
      xhr.onreadystatechange = readystatechange;
      xhr.responseType       = type ? type : "";
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
        value = (value + "").replace(/\s+/g, '+');
        params += key + "=" + value + "&";
      }
      // Remove that extraneous last '&'
      params = params.replace(/&$/, '');

      return params;
    },

    buildFlickrOptions: function(options) {
      options                = options ? options : {};

      options.format         = 'json';
      options.api_key        = APILightbox.flickrApiKey;
      options.nojsoncallback = 1;

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
      APILightbox.maxPhotoIndex = maxCount - 1;
    }

    if(searchText && typeof searchText == 'string') {
      APILightbox.searchText = searchText;
    }

    var flickrOptions = {
      method:       'flickr.photos.search',
      text:         searchText ? searchText : APILightbox.searchText,
      page:         1,
      per_page:     maxCount ? maxCount : APILightbox.maxPhotoIndex + 1,
      media:        'photos',
      content_type: 1
    };

    flickrOptions = APILightbox.utils.buildFlickrOptions(flickrOptions);

    var url = APILightbox.flickrRestUrlBase;

    url += APILightbox.utils.buildUrlParams(flickrOptions);

    APILightbox.utils.ajax('get', url, null, function(status, response) {
      response = JSON.parse(response);
      if(status == 200 && response.stat == 'ok') {
        APILightbox.populateResults(response);
      }
    });
  },

  populateResults: function(response) {
    var searchString = document.querySelectorAll('h1 .search-string')[0];

    if(response.photos.total * 1 > 0) {
      APILightbox.photos = response.photos;
      APILightbox.showImage(0, response.photos);
      searchString.innerText = APILightbox.searchText;
    } else {
      searchString.innerText = "No results found.";
    }
  },

  showImage: function(index) {
    var title = document.querySelectorAll('.lightbox .title')[0],
        image = document.querySelectorAll('.response .photo')[0];

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
  },

  showSearchForm: function() {
    var searchForm  = document.querySelectorAll('.search-form')[0],
        searchInput = document.querySelectorAll('.search-form .search-keywords')[0];

    searchInput.value = '';
    APILightbox.utils.show(searchForm, '30px');
    searchInput.focus();
  },

  checkEnter: function(event) {
    var characterCode = event.keyCode;

    if(characterCode == 13) { // if enter key
      APILightbox.doSearch();
      return false;
    } else {
      return true;
    }
  },

  doSearch: function() {
    var searchForm   = document.querySelectorAll('.search-form')[0],
        searchString = document.querySelectorAll('.page-title .search-string')[0],
        searchInput  = document.querySelectorAll('.search-form .search-keywords')[0];

    var keywords = APILightbox.utils.sanitizeInput(searchInput.value);
    if(keywords != '' && keywords != ' ')
    {
      APILightbox.getImages(keywords);
      APILightbox.utils.hide(searchForm);
    }
  },

  initialize: function() {
    var edit        = document.querySelectorAll('.page-title .edit')[0],
        searchInput = document.querySelectorAll('.search-form .search-keywords')[0],
        search      = document.querySelectorAll('.search-form .search')[0],
        previous    = document.querySelectorAll('.lightbox .paging-controls .previous')[0],
        next        = document.querySelectorAll('.lightbox .paging-controls .next')[0];

    edit.addEventListener('click', APILightbox.showSearchForm, false);
    searchInput.addEventListener('keypress', APILightbox.checkEnter, false);
    search.addEventListener('click', APILightbox.doSearch, false);
    previous.addEventListener('click', APILightbox.showPreviousImage, false);
    next.addEventListener('click', APILightbox.showNextImage, false);
  }
};
