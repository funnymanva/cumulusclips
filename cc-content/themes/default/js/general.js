// Global vars
var cumulusClips = {};
cumulusClips.baseUrl = $('meta[name="baseUrl"]').attr('content');
cumulusClips.themeUrl = $('meta[name="theme"]').attr('content');
cumulusClips.videoId = $('meta[name="videoId"]').attr('content');


$(document).ready(function(){

    // Default text Focus
    $('.defaultText').focus(function(){
        if ($(this).val() == $(this).attr('title') && !$(this).hasClass('customText')) {
            $(this).addClass('customText');
            $(this).val('');
        }
    });
    // Default text Blur
    $('.defaultText').blur(function(){
        if ($(this).val() == '') {
            $(this).removeClass('customText');
            $(this).val($(this).attr('title'));
        }
    });


    // Tabs Show/Hide Block
    $('.tabs a').click(function(){
        // Skip for non show/hide tabs
        if ($(this).data('block') == 'undefined') return false;
        
        // Hide all blocks except for targeted block
        var block = '#' + $(this).data('block');
        $('.tab_block').not(block).hide();
        
        // Toggle targeted block
        if ($(this).parent().hasClass('keepOne')) {
            $(block).show();
        } else {
            $(block).toggle({
                complete:function(){$(block).trigger('tabToggled');},
                duration:0
            });
        }
        return false;
    });  


    // Show/Hide Block
    $('.showhide').click(function(){
        // Retrieve and toggle targeted block
        var block = $(this).data('block');
        $('#'+block).toggle();

        // Prevent link click through
        if ($(this).is('a')) return false;
    });


    // Attach confirm popup to confirm action links
    $('.confirm').click(function() {
        // Code to execute once string is retrieved
        var location = $(this).attr('href')
        var callback = function(confirmString){
            var agree = confirm(confirmString);
            if (agree) window.location = location;
        }

        // Retrieve confirm string
        getText(callback, $(this).data('node'), $(this).data('replacements'));
        return false;
    });


    // Attach flag action to flag links / buttons
    $('.flag').click(function(){
        var url = cumulusClips.baseUrl+'/actions/flag/';
        var data = {type: $(this).data('type'), id: $(this).data('id')};
        executeAction(url, data);
        window.scrollTo(0, 0);
        return false;
    });


    // Attach Subscribe & Unsubscribe action to buttons
    $('.subscribe').click(function(){
        var subscribeType = $(this).data('type');
        var url = cumulusClips.baseUrl+'/actions/subscribe/';
        var data = {type: subscribeType, user: $(this).data('user')};
        var subscribeButton = $(this);

        // Callback for AJAX call - Update button if the action (subscribe / unsubscribe) was successful
        var callback = function(responseData) {
            if (responseData.result == 1) {
                subscribeButton.text(responseData.other);
                if (subscribeType == 'subscribe') {
                    subscribeButton.data('type','unsubscribe');
                } else if (subscribeType == 'unsubscribe') {
                    subscribeButton.data('type','subscribe');
                }
            }
            window.scrollTo(0, 0);
        }

        executeAction(url, data, callback);
        return false;
    });


    // Attach rating action to like & dislike links
    $('.rating').click(function(){
        var url = cumulusClips.baseUrl+'/actions/rate/';
        var data = {video_id: videoId, rating: $(this).data('rating')};
        var callback = function(responseData) {
            if (responseData.result == 1) {
                $('.actions .left .like').text(responseData.other.likes);
                $('.actions .left .dislike').text(responseData.other.dislikes);
            }
            window.scrollTo(0, 0);
        }
        executeAction(url, data, callback);
        return false;
    });


    // Play Video Page
    if ($('.play').length > 0) {
        getText(function(responseData, textStatus, jqXHR){cumulusClips.replyToText = responseData;}, 'reply_to');
        getText(function(responseData, textStatus, jqXHR){cumulusClips.replyText = responseData;}, 'reply');
        getText(function(responseData, textStatus, jqXHR){cumulusClips.reportAbuseText = responseData;}, 'report_abuse');
        $.get(cumulusClips.themeUrl + '/blocks/comment.html', function(responseData, textStatus, jqXHR){cumulusClips.commentTemplate = responseData;});
        cumulusClips.lastCommentId = $('.commentList > div:last-child').data('comment');
        cumulusClips.commentCount = Number($('#comments .totals span').text());
        cumulusClips.loadMoreComments = (cumulusClips.commentCount > 5) ? true : false;


        // Scrollbar for 'Add Video To' widget
        var scrollableList = $('#addToPlaylist > div:first-child > div');
        scrollableList.jScrollPane();
        $('#addToPlaylist').on('tabToggled',function(){
            if ($(this).css('display') == 'block' && scrollableList.length > 0) {
                api = scrollableList.data('jsp');
                api.reinitialise();
            }
        });


        // Attach scrollbar to playlist widget if viewing a playlist
        if ($('#playlistVideos .videos_list').length > 0) {
            $('#playlistVideos .videos_list').jScrollPane();
            var playlistScrollApi = $('#playlistVideos .videos_list').data('jsp');
            var activePlaylistVideo = $('#playlistVideos .videos_list .active');
            playlistScrollApi.scrollTo(0, activePlaylistVideo.index()*76);
        }


        // Make entire playlist video tile clickable
        $('#playlistVideos .video_small').click(function(){
            location = $(this).find('div > a').attr('href');
        });


        // Add video to playlist on play page
        $('#addToPlaylist li a').click(function(){
            var link = $(this);
            var url = cumulusClips.baseUrl+'/actions/playlist/';
            var data = {
                action: 'add',
                video_id: videoId,
                playlist_id: $(this).data('playlist_id')
            };
            var callback = function(addToPlaylistResponse){
                var newNameAndCount = link.text().replace(/\([0-9]+\)/, '(' + addToPlaylistResponse.other.count + ')');
                link.text(newNameAndCount);
                link.addClass('added');
            };
            executeAction(url, data, callback);
            return false;
        });


        // Create new playlist on play page
        $('#addToPlaylist form').submit(function(event){
            var createPlaylistForm = $(this);
            var data = $(this).serialize();
            var url = cumulusClips.baseUrl+'/actions/playlist/';
            var callback = function(createPlaylistResponse){
                $('#addToPlaylist ul').append('<li><a data-playlist_id="' + createPlaylistResponse.other.playlistId + '" class="added" href="">' + createPlaylistResponse.other.name + ' (' + createPlaylistResponse.other.count + ')</a></li>');
                createPlaylistForm.find('input[type="text"]').val('');
                createPlaylistForm.find('select').val('public');
            };
            executeAction(url, data, callback);
            event.preventDefault();
        });


        // Attach comment action to comment forms
        $('#comments form').submit(function(){
            var url = cumulusClips.baseUrl+'/actions/comment/add/';
            var callback = function(responseData) {
                if (responseData.result === true) {
                    // Reset comment form
                    $('#comments form').addClass('collapsed').find('input[type="text"]').val('');
                    var commentField = $('#comments form').find('textarea');
                    commentField.val(commentField.attr('title'));

                    // Append new comment if auto-approve comments is on
                    if (responseData.other.autoApprove === true) {
                        var newComment = buildComment(cumulusClips.commentTemplate, responseData.other.comment);
                        $('#comments .commentList').append(newComment);
                    }
                }
                window.scrollTo(0, 0);
            }
            executeAction(url, $(this).serialize(), callback);
            return false;
        });


        // Expand collapsed comment form was activated
        $('.comments_form').focusin(function(){
            if ($(this).hasClass('collapsed')) {
                $(this).removeClass('collapsed');
                $(this).find('textarea').val('');
            }
        });

        // Collapse comment form when empty and deactivated
        $(document).on('click', function(event){
            var clickedElement = $(event.target);
            if (clickedElement.parents('.comments_form').length === 0) {
                // Verify comment text fields aren't empty
                var commentsForm = $('.comments_form');
                var commentTextFields = commentsForm.find('input[type="text"]');
                var collapseForm = true;
                for (var i = 0; i < commentTextFields.length; i++) {
                    var textField = commentTextFields[i];
                    if ($(textField).val() !== '') {
                        collapseForm = false;
                        break;
                    }
                }

                // Verify comment field isn't empty
                var commentField = commentsForm.find('textarea');
                if (commentField.val() !== '') collapseForm = false;

                // Collapse form if form is empty
                if (collapseForm) {
                    commentsForm.addClass('collapsed');
                    commentField.val(commentField.attr('title'));
                }
            }
        });


        // Load more comments
        $('.loadMoreComments a').on('click', function(event){
            // Verify that more comments are available
            if (cumulusClips.loadMoreComments) {
                var data = {videoId:cumulusClips.videoId, lastCommentId:cumulusClips.lastCommentId, limit: 5};
                var loadingText = $(this).data('loading_text');
                var loadMoreText = $(this).text();
                $(this).text(loadingText);
                // Retrieve subsequent comments
                $.ajax({
                    type        : 'get',
                    data        : data,
                    dataType    : 'json',
                    url         : cumulusClips.baseUrl + '/actions/comments/get/',
                    success     : function(responseData, textStatus, jqXHR){
                        var lastCommentKey = responseData.other.comments.length-1;
                        cumulusClips.lastCommentId = responseData.other.comments[lastCommentKey].commentId;
                        // Loop through comment data set, inject into comment template and append to list
                        $.each(responseData.other.comments, function(key, comment){
                            $('.commentList').find('div[data-comment="' + comment.commentId + '"]').remove();
                            var commentElement = buildComment(cumulusClips.commentTemplate, comment);
                            $('.commentList').append(commentElement);
                        });

                        // Hide load more button if no more comments are available
                        if ($('.commentList .comment').length < cumulusClips.commentCount) {
                            cumulusClips.loadMoreComments = true;
                            $('.loadMoreComments a').text(loadMoreText);
                        } else {
                            cumulusClips.loadMoreComments = false;
                            $('.loadMoreComments').remove();
                        }
                    }
                });
            }
            event.preventDefault();
        });
    }   // END Play Video page


    // Regenerate Private URL
    $('#private_url a').click(function(){
        $.ajax({
            type    : 'get',
            url     : cumulusClips.baseUrl + '/private/get/',
            success : function(responseData, textStatus, jqXHR) {
                $('#private_url span').text(responseData);
                $('#private_url input').val(responseData);
            }
        });
        return false;
    });


    // Add to Watch Later actions
    $('.video .watchLater a').on('click', function(event){
        event.stopPropagation();
        event.preventDefault();
        
        var video = $(this).parents('.video');
        var url = cumulusClips.baseUrl+'/actions/playlist/';
        var data = {
            action: 'add',
            shortText: true,
            video_id: $(this).data('video'),
            playlist_id: $(this).data('playlist')
        };
        
        // Make call to API to attempt to add video to playlist
        $.ajax({
            type: 'POST',
            data: data,
            dataType: 'json',
            url: url,
            success: function(responseData, textStatus, jqXHR){
                // Append message to video thumbnail
                var resultMessage = $('<div></div>')
                    .addClass('message')
                    .html('<p>' + responseData.message + '</p>');
                video.find('.thumbnail').append(resultMessage);
                
                // Style message according to add results
                if (responseData.result === 1) {
                    resultMessage.addClass('success');
                } else {
                    if (responseData.other.status === 'DUPLICATE') resultMessage.addClass('errors');
                }

                // FadeIn message, pause, then fadeOut and remove
                resultMessage.fadeIn(function(){
                    setTimeout(function(){
                        resultMessage.fadeOut(function(){resultMessage.remove();});
                    }, 2000);
                });
            }
        });
    });

}); // END jQuery





/****************
GENERAL FUNCTIONS
****************/

/**
 * Retrieve localised string via AJAX
 * @param function callback Code to be executed once AJAX call to retrieve text is complete
 * @param string node Name of term node in language file to retrieve
 * @param json replacements (Optional) List of key/value replacements in JSON format
 * @return void Requested string, with any replacements made, is passed to callback
 * for any futher behaviour
 */
function getText(callback, node, replacements)
{
    $.ajax({
        type        : 'POST',
        url         : cumulusClips.baseUrl+'/language/get/',
        data        : {node:node, replacements:replacements},
        success     : callback
    });
}

/**
 * Send AJAX request to the action's server handler script
 * @param string url Location of the action's server handler script
 * @param json || string data The data to be passed to the server handler script
 * @param function callback (Optional) Code to be executed once AJAX call to handler script is complete
 * @return void Message is display according to server response. Any other
 * follow up behaviour is performed within the callback
 */
function executeAction(url, data, callback)
{
    $.ajax({
        type        : 'POST',
        data        : data,
        dataType    : 'json',
        url         : url,
        success     : function(responseData, textStatus, jqXHR){
            displayMessage(responseData.result, responseData.message);
            if (typeof callback != 'undefined') callback(responseData, textStatus, jqXHR);
        }
    });
}

/**
 * Display message sent from the server handler script for page actions
 * @param boolean result The result of the requested action (1 = Success, 0 = Error)
 * @param string message The textual message for the result of the requested action
 * @return void Message block is displayed and styled accordingly with message.
 * If message block is already visible, then it is updated.
 */
function displayMessage(result, message)
{
    var cssClass = (result === true) ? 'success' : 'errors';
    var existingClass = ($('.message').hasClass('success')) ? 'success' : 'errors';
    $('.message').show();
    $('.message').html(message);
    $('.message').removeClass(existingClass);
    $('.message').addClass(cssClass);
}

/**
 * Generates comment card to be appended to comment list on play page
 * @param string commentTemplate The HTML template of the comment card
 * @param object commentData The Comment object for the comment being appended
 * @return object the jQuery object of the filled comment card
 */
function buildComment(commentTemplate, commentData)
{
    var comment = $(commentTemplate);
    comment.attr('data-comment', commentData.commentId);
    
    // Set comment avatar
    if (commentData.author !== null && commentData.author.avatar !== null) {
        comment.find('img').attr('src', cumulusClips.baseUrl + '/cc-uploads/avatars/' + commentData.author.avatar + '.jpg');
    } else {
        comment.find('img').attr('src', cumulusClips.themeUrl + '/images/avatar.gif');
    }
    
    // Set comment author
    if (commentData.userId !== '0') {
        var author = commentData.author;
        comment.find('.commentAuthor').html(
            $('<a>')
                .attr('href', cumulusClips.baseUrl + '/members/' + author.username)
                .text(author.username)
        );
    } else {
        comment.find('.commentAuthor').text(commentData.name);
    }
    
    // Set comment date
    var commentDate = new Date(commentData.dateCreated);
    monthPadding = (String(commentDate.getMonth()+1).length === 1) ? '0' : '';
    datePadding = (String(commentDate.getDate()).length === 1) ? '0' : '';
    comment.find('.commentDate').text(monthPadding + (commentDate.getMonth()+1) + '/' + datePadding + commentDate.getDate() + '/' + commentDate.getFullYear());
    
    // Set comment links
    comment.find('.commentAction a:first-child').text(cumulusClips.replyText);
    comment.find('.flag')
        .text(cumulusClips.reportAbuseText)
        .attr('data-id', commentData.commentId);
 
    // Set comments
    commentData.comments = commentData.comments.replace(/</g, '&lt;');
    commentData.comments = commentData.comments.replace(/>/g, '&gt;');
    comment.find('> div p:last-child').text(commentData.comments);
    var cleanComments = comment.find('> div p:last-child').text();
    var replyMatches = cleanComments.match(/@user:([a-z0-9]+)/i);
    if (replyMatches) {
        var replyLinkContainer = $('<div/>');
        var replyLink = $('<a>')
            .attr('href', cumulusClips.baseUrl + '/members/' + replyMatches[1])
            .attr('title', cumulusClips.replyToText)
            .text('@' + replyMatches[1]);
        replyLinkContainer.append(replyLink);
        cleanComments = cleanComments.replace(/@user:[a-z0-9]+/i, replyLinkContainer.html());
    }
    comment.find('> div p:last-child').html(cleanComments.replace(/\r\n|\n|\r/g, '<br>'));
    
    return comment;
}