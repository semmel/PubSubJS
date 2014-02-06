/*
Copyright (c) 2010,2011,2012,2013 Morgan Roderick http://roderick.dk
License: MIT - http://mrgnrdrck.mit-license.org

Copyright (c) 2014 Visisoft OHG http://visisoft.de
https://github.com/semmel/PubSubJS

see Crockford: JavaScript: The Good Parts, section "Parts"
*/
/*jslint white:true, plusplus:true, stupid:true*/
/*global
	setTimeout,
	module,
	exports,
	define,
	require,
	window
*/
(function(root, factory){
	'use strict';

	// CommonJS
	if (typeof exports === 'object' && module)
	{
		module.exports = factory();

	// AMD
	}
	else if (typeof define === 'function' && define.amd)
	{
		define(factory);

	// Browser
	}
	else
	{
		root.createPublisher = factory();
	}
}( ( typeof window === 'object' && window ) || this
	, function()
{
	/**
	 *	Returns a function that throws the passed exception, for use as argument for setTimeout
	 *	@param { Object } ex An Error object
	 */
	function throwException( ex ){
		return function reThrowException(){
			throw ex;
		};
	}

	function callSubscriberWithDelayedExceptions( subscriber, message, data ){
		try {
			subscriber( message, data );
		} catch( ex ){
			setTimeout( throwException( ex ), 0);
		}
	}

	function callSubscriberWithImmediateExceptions( subscriber, message, data ){
		subscriber( message, data );
	}

	/**
	 * Adds PubSub functionality to the given object.
	 * I.e. augments <tt>publish, publishSync, subscribe</tt> and <tt>unsubscribe</tt> methods.
	 * @param {Object=} subject If not given a plain PubSub object is returned
	 * @returns {Object}
	 */
	function createPublisher(subject)
	{
		var
			self = subject || {},
			registry = {},
			lastUid = -1;


		function deliverMessage( originalMessage, matchedMessage, data, immediateExceptions )
		{
			var subscribers = registry[matchedMessage];
			var callSubscriber = immediateExceptions ? callSubscriberWithImmediateExceptions
					: callSubscriberWithDelayedExceptions;
			var i;

			if ( !registry.hasOwnProperty( matchedMessage ) ) {
				return;
			}

			// do not cache the length of the subscribers array, as it might change if there are unsubscribtions
			// by subscribers during delivery of a topic
			// see https://github.com/mroderick/PubSubJS/issues/26
			for (i = 0; i < subscribers.length; i++ )
			{
				callSubscriber( subscribers[i].func, originalMessage, data );
			}
		}

		function createDeliveryFunction( message, data, immediateExceptions ){
			return function deliverNamespaced(){
				var topic = String( message ),
					position = topic.lastIndexOf( '.' );

				// deliver the message as it is now
				deliverMessage(message, message, data, immediateExceptions);

				// trim the hierarchy and deliver message to each level
				while( position !== -1 ){
					topic = topic.substr( 0, position );
					position = topic.lastIndexOf('.');
					deliverMessage( message, topic, data );
				}
			};
		}

		function messageHasSubscribers( message ){
			var topic = String( message ),
				found = registry.hasOwnProperty( topic ),
				position = topic.lastIndexOf( '.' );

			while ( !found && position !== -1 ){
				topic = topic.substr( 0, position );
				position = topic.lastIndexOf('.');
				found = registry.hasOwnProperty( topic );
			}

			return found && registry[topic].length > 0;
		}

		function publish( message, data, sync, immediateExceptions ){
			var deliver = createDeliveryFunction( message, data, immediateExceptions ),
				hasSubscribers = messageHasSubscribers( message );

			if ( !hasSubscribers ){
				return false;
			}

			if ( sync === true ){
				deliver();
			} else {
				setTimeout( deliver, 0 );
			}
			return true;
		}

		/**
		 *	PubSub.publish( message[, data] ) -> Boolean
		 *	- message (String): The message to publish
		 *	- data: The data to pass to subscribers
		 *	Publishes the the message, passing the data to it's subscribers
		**/
		self.publish = function( message, data ){
			return publish( message, data, false, self.immediateExceptions );
		};

		/**
		 *	PubSub.publishSync( message[, data] ) -> Boolean
		 *	- message (String): The message to publish
		 *	- data: The data to pass to subscribers
		 *	Publishes the the message synchronously, passing the data to it's subscribers
		**/
		self.publishSync = function( message, data ){
			return publish( message, data, true, self.immediateExceptions );
		};

		/**
		 *	PubSub.subscribe( message, func ) -> String
		 *	- message (String): The message to subscribe to
		 *	- func (Function): The function to call when a new message is published
		 *	Subscribes the passed function to the passed message. Every returned token is unique and should be stored if
		 *	you need to unsubscribe
		**/
		self.subscribe = function( message, func ){
			if ( typeof func !== 'function'){
				return false;
			}

			// message is not registered yet
			if ( !registry.hasOwnProperty( message ) ){
				registry[message] = [];
			}

			// forcing token as String, to allow for future expansions without breaking usage
			// and allow for easy use as key names for the 'messages' object
			var token = String(++lastUid);
			registry[message].push( { token : token, func : func } );

			// return token for unsubscribing
			//return token;
			// return a subscription object with a dispose method
			return { dispose: self.unsubscribe.bind(self, token) };
		};

		/**
		 *	PubSub.unsubscribe( tokenOrFunction ) -> String | Boolean
		 *  - tokenOrFunction (String|Function): The token of the function to unsubscribe or func passed in on subscribe
		 *  Unsubscribes a specific subscriber from a specific message using the unique token
		 *  or if using Function as argument, it will remove all subscriptions with that function
		**/
		self.unsubscribe = function( tokenOrFunction ){
			var isToken = typeof tokenOrFunction === 'string',
				key = isToken ? 'token' : 'func',
				successfulReturnValue = isToken ? tokenOrFunction : true,

				result = false,
				m, i;

			for ( m in registry ){
				if ( registry.hasOwnProperty( m ) ){
					for ( i = registry[m].length-1 ; i >= 0; i-- ){
						if ( registry[m][i][key] === tokenOrFunction ){
							registry[m].splice( i, 1 );
							result = successfulReturnValue;

							// tokens are unique, so we can just return here
							if ( isToken ){
								return result;
							}
						}
					}
				}
			}

			return result;
		};

		/// remove all references to the subscribers
		/// useful if the publisher is destroyed
		self.unsubscribeAll = function()
		{
			registry = {};
		};

		return self;
	}

	return createPublisher;
}));
