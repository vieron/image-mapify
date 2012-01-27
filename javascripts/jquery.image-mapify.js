;(function($, window, document, undefined){


  $.fn.encHTML = function() {
      var html = this.html();
      return html.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  };

  $.fn.decHTML = function() {
      var html = this.html();
      return html.replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>');
  };


  
  $.fn.imageMapify = function(options){
    
    var opts = $.extend(options, $.fn.imageMapify.defaults, {}),
        $this = $(this);
        
        
    var _ = {
              $activeShape : undefined,
              targetlink_opts : ['none', '_blank', '_parent']
            };
          
    var tpl = {
      shape_options : '\
      <div class="shape_options">\
        <h2>Selected Shape Options</h2>\
        <p>\
          <label for="shape_link">Link</label>\
          <input type="text" name="shape_link" value="{{shape_link}}" id="shape_link" />\
        </p>\
        <p>\
          <label for="shape_text_targetlink">Link target</label>\
          <select name="shape_text_targetlink" id="shape_text_targetlink">\
            <option value="none">None</option>\
            <option value="_blank">New tab</option>\
            <option value="_parent">Same window</option>\
          </select>\
        </p>\
        <p>\
          <label for="shape_text">Text</label>\
          <input type="text" name="shape_text" value="{{shape_text}}" id="shape_text" />\
        </p>\
        <p>\
          <label for="shape_text_shown">Show text?</label>\
          <input type="checkbox" name="shape_text_shown" {{shape_text_shown}} id="shape_text_shown" />\
        </p>\
        <p class="actions">\
          <a href="#" class="delete">Delete Shape</a>  \
        </p>\
      </div>'
    }
          
    var $DOM = {
      body : $('body'),
      viewport : $this.find(opts.viewport),
      settings : $this.find(opts.settings),
      canvas : $('<div/>', opts.canvas.attrs),
      bgImage : $('<img/>', opts.bgImage.attrs),
      dialog : $('<div/>', opts.dialog.attrs),
      s_bgImage : $this.find(opts.s_bgImage),
      s_addShape : $this.find(opts.s_addShape),
      s_generateCode : $this.find(opts.s_generateCode),
      s_code : $this.find(opts.s_code),
      s_preview : $this.find(opts.s_preview),
      shapes : undefined
    };
    
    var DOMHandler = {
      setBgImage : function(url){
        
        DOMHandler.imageExists(url, function(e){
          $DOM.bgImage.attr('src', url);
          
          $DOM.canvas.css({
            width : e.target.width+'px',
            height : e.target.height+'px'
          })
        })
        
        return $DOM.bgImage;
      },
      
      imageExists : function(url, onload, onerror){
          var stop = function(){ return false; };
          var img = new Image();
          img.onload = onload ;
          img.onerror = onerror ;
          
          img.src = url;
      },
      
      addShape : function(){
       var ui_opts = { containment: $DOM.canvas };
       
       var $shape = $('<a/>', opts.shape.attrs)
          .appendTo($DOM.canvas)
          .bind('dblclick', events.toggleActiveShape)
          .resizable(ui_opts)
          .draggable(ui_opts);
         
        $DOM.shapes = $DOM.shapes ? $DOM.shapes.add($shape) : $shape;
        $shape.trigger('dblclick');        
      },
      
      showShapeSettings : function($shape){
        $DOM.settings.find('.shape_options').remove();
        
        var shape_options = tpl.shape_options.replace('{{shape_text}}', $shape.data('shape_text') || '')
                                             .replace('{{shape_link}}', $shape.data('shape_link') || '')
                                             .replace('{{shape_text_shown}}', $shape.data('shape_text_shown') || '');
        
        var $shape_options = $(shape_options).appendTo($DOM.settings);
        
        //selects
        $shape_options.find('select').each(function(){
          var $select = $(this);
          $select.find('option').filter(function(){ return this.value == $shape.data( $select[0].id ) }).attr('selected', 'selected');
        });
        
        $shape_options
          .find(':checkbox, select')
            .bind('change', events.saveShapeOptions($shape))
          .end()
          .find(':text')
            .bind('keyup', events.saveShapeOptions($shape))
          .end()
          .find('.delete')
            .bind('click', events.deleteShape($shape));
        
      },
      
      getCode : function(){
        var $code = $DOM.viewport.clone(true);
        
        $code
          .find('.shape')
          .map(function(){
            var $shape = $(this);
            
            $.inArray($shape.data('shape_text_shown'), [undefined, '']) || $shape.css('text-indent', '-9999em');

            $shape.attr({
              href : $shape.data('shape_link'),
              title : $shape.data('shape_text'),
              target : $shape.data('shape_text_targetlink') != 'none' ? $shape.data('shape_text_targetlink') : false 
            })
            .css(opts.output_shape.attrs.css)
            .html( $shape.data('shape_text') || '' ).removeAttr('class');
            
            return $shape;
            
          });
        
        
        return $code;
      }
      
      
      
    };
    
    var events = {
       toggleActiveShape : function(e){
         var $shape = $(this),
             isActive = $shape.hasClass('.active');
          
         $DOM.shapes.removeClass('active');
         $(this).addClass('active');
         _.$activeShape = $shape;
         DOMHandler.showShapeSettings($shape);
       },
       saveShapeOptions : function($shape){
         
         return function(e){
            var $input = $(this),
                type = $input.attr('type');

                if (type == 'text') {
                  $shape.data( $input.attr('id') , $input.val() );
                }else if(type == 'checkbox'){
                  $shape.data( $input.attr('id') , ($input.is(':checked') ? 'checked="checked"' : '') );                    
                }else if($input[0].nodeName == 'SELECT'){
                  $shape.data( $input.attr('id') , $input.val() );
                };

          }
       },
       deleteShape : function($shape){
         return function(e){ 
            e.preventDefault();
            //update active shapes collection
            $DOM.shapes = $DOM.shapes.not($shape);
            //remove shape
            $shape.remove();
            $DOM.settings.find('.shape_options').remove();
            //select other shape
            $DOM.shapes.last().trigger('dblclick');
           }
       }
    }
    


    //init
    $DOM.canvas.appendTo($DOM.viewport);
    $DOM.bgImage.appendTo($DOM.canvas);
    $DOM.dialog.appendTo($DOM.body);
    $DOM.dialog.dialog({ modal: true, autoOpen: false });
    
    $DOM.s_bgImage.bind('blur', function(){
      DOMHandler.setBgImage( $(this).val() );
    })
    
    $DOM.s_addShape.bind('click', function(e){
      e.preventDefault();
      DOMHandler.addShape();
    })
    
    $DOM.s_generateCode.bind('click', function(e){
      e.preventDefault();
      var $code = DOMHandler.getCode();
      $DOM.dialog.html( '<code><pre style="width:580px; height:600px; white-space:normal;">'+$code.encHTML()+'</pre></code>' );
      $DOM.dialog.dialog('open').dialog( "option", "width", 600 );
    });
    
    $DOM.s_preview.bind('click', function(e){
      e.preventDefault();
      $DOM.dialog.html( DOMHandler.getCode().html() );
      $DOM.dialog.dialog('open').dialog( "option", "width", $DOM.canvas.width()+37 );
    });
    
    
    $DOM.s_bgImage.trigger('blur');
    
    
    return this;
    
  }



  $.fn.imageMapify.defaults = {
    viewport : '#viewport',
    settings : '#settings',
    s_bgImage : '#background_image_url',
    s_addShape : '#add_shape',
    s_generateCode : '#generate_code',
    s_preview : '#preview',
    canvas : {
      attrs : {
        id : 'canvas',
        css : {
          position : 'relative',
          width : '100%',
          margin: '0 auto'
        }
      }
    },
    shape : {
      attrs : {
       'class' : 'shape active',
        css : {
          position : 'absolute',
          width : 70,
          height : 70,
          display : 'block',
          background : 'rgba(255,255,255,.4)',
          'z-index' : 10,
          top : '35%'
        }
      }
    },
    output_shape : {
      attrs : {
        css : {
          background : 'url(http://vieron.github.com/image-mapify/images/transparent.gif)',
          border : 'none'
        }
      }
    },
    bgImage : {
      attrs : {
        id : 'bgImage',
        css : {
          display : 'block',
          position : 'relative',
          'z-index': 1
        }
      }
    },
    dialog : {
     attrs : {
       id : 'dialog',
       css : {
         display : 'none'
       }
     }
    }
  };
  
  
})(jQuery, window, document);