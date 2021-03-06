# PubSubJS

PubSubJS is a dependency free [publish/subscribe](http://en.wikipedia.org/wiki/Publish/subscribe) library for [JavaScript](https://developer.mozilla.org/en/JavaScript).

PubSubJS has synchronisation decoupling, so messages are delivered asynchronously. This helps keep your program predictable as the originator of messages will not be blocked while consumers process messages.

For the adventurous, PubSubJS also supports synchronous message publication. This can give a speedup in some environments (browsers, not all), but can also lead to some very difficult to reason about programs, when one message triggers publication of another message in the same execution chain.

## Changes to the original project

* PubSub is instantiable. I.e. there is no singleton `PubSub` as in [@mroderick's original branch](https://github.com/mroderick/PubSubJS). Instead there is the creation function `createPublisher`.
* Flexible subscriber function signature.


## Key features

* Dependency free
* Synchronization decoupling
* Topic hierarchy
* AMD / CommonJS module support
* No modification of subscribers (jQuery custom events modify subscribers)
* Easy to understand and use (thanks to synchronization decoupling)
* Small(ish), less than 1kb minified and gzipped

## Examples

### Basic example

```javascript
// create a function to receive messages
var mySubscriber = function( msg, data ){
    console.log( msg, data );
};

var publisher = createPublisher();

// add the function to the list of subscribers for a particular message
// we're keeping the returned subscription object, in order to be able to unsubscribe
// from the message later on
var subscription = publisher.subscribe( 'MY MESSAGE', mySubscriber );

// publish a message asyncronously
publisher.publish( 'MY MESSAGE', 'hello world!' );
// logs 'MY MESSAGE', 'hello world!' to the console 

// publish a message syncronously, which is faster in some environments,
// but will get confusing when one message triggers new messages in the
// same execution chain
// USE WITH CAUTION, HERE BE DRAGONS!!!
publisher.publishSync( 'MY MESSAGE', 'hello world!' );
```

### Cancel specific subscripiton

```javascript
// create a handler function to receive the message
var mySubscriber = function( msg, data ){
    console.log( msg, data );
};

var publisher = createPublisher();

// add the function to the list of subscribers to a particular message
// we're keeping the returned token, in order to be able to unsubscribe
// from the message later on
var subscription = publisher.subscribe( 'MY MESSAGE', mySubscriber );

// unsubscribe from further messages
subscription.dispose();
```

### Cancel all subscriptions for a function or any

```javascript
// create a function to receive the message
var mySubscriber = function( msg, data ){
    console.log( msg, data );
};

var publisher = createPublisher();

// add the function to the list of subscribers to a particular message
// we're keeping the returned token, in order to be able to unsubscribe
// from the message later on
var subscription = publisher.subscribe( 'MY MESSAGE', mySubscriber );

// unsubscribe mySubscriber from ALL further messages
publisher.unsubscribe( mySubscriber );

// dispose ALL subscribers, e.g. before the publisher is destroyed.
publisher.unsubscribeAll();
```

### Change the handler functions' signature

```javascript
// this handler function receives the event's payload in it's single argument
var mySubscriber = function( data ){
    console.log( data );
};

var publisher = createPublisher({
	handlerInvoker: function(handler, message, payload){
			handler(payload);
		}
	}
);

// register the handler
var subscription = publisher.subscribe( 'topic', mySubscriber );

publisher.publish( 'topic', 'hello world!' );
// logs 'hello world!' to the console 
```

### Hierarchical addressing

```javascript
// create a subscriber to receive all messages from a hierarchy of topics
var myToplevelSubscriber = function( msg, data ){
    console.log( 'top level: ', msg, data );
}

var publisher = createPublisher();

// subscribe to all topics in the 'car' hierarchy
publisher.subscribe( 'car', myToplevelSubscriber );

// create a subscriber to receive only leaf message from hierarchy op topics
var mySpecificSubscriber = function( msg, data ){
    console.log('specific: ', msg, data );
}

// subscribe only to 'car.drive' topics
publisher.subscribe( 'car.drive', mySpecificSubscriber );

// Publish some topics
publisher.publish( 'car.purchase', { name : 'my new car' } );
publisher.publish( 'car.drive', { speed : '14' } );
publisher.publish( 'car.sell', { newOwner : 'someone else' } );

// In this scenario, myToplevelSubscriber will be called for all
// topics, three times in total
// But, mySpecificSubscriber will only be called once, as it only
// subscribes to the 'car.drive' topic
```

## Tips

Use "constants" for topics and not string literals. PubSubJS uses strings as topics, and will happily try to deliver
your messages with ANY topic. So, save yourself from frustrating debugging by letting the JavaScript engine complain
when you make typos.

### Example of use of "constants"

```javascript
var publisher = createPublisher();

// BAD
publisher.subscribe("hello", function( msg, data ){
	console.log( data )
});

publisher.publish("hello", "world");

// BETTER
var MY_TOPIC = "hello";
publisher.subscribe(MY_TOPIC, function( msg, data ){
	console.log( data )
});

publisher.publish(MY_TOPIC, "world");
```

### Immediate Exceptions for stack traces in developer tools

As of versions 1.3.2, you can force immediate exceptions (instead of delayed execeptions), which has the benefit of maintaining the stack trace when viewed in dev tools.

This should be considered a development only option, as PubSubJS was designed to try to deliver your topics to all subscribers, even when some fail.

Setting immediate exceptions in development is easy, just tell PubSubJS about it after it's been loaded.

```javascript
var publisher = createPublisher();
publisher.immediateExceptions = true;
```
## Road map

* subscribe for multiple events with a single handler
* disallow events containing spaces


## More about Publish/Subscribe

* [The Many Faces of Publish/Subscribe](http://www.cs.ru.nl/~pieter/oss/manyfaces.pdf) (PDF)
* [Addy Osmani's mini book on Patterns](http://addyosmani.com/resources/essentialjsdesignpatterns/book/#observerpatternjavascript)
* [Publish / Subscribe Systems, A summary of 'The Many Faces of Publish / Subscribe'](http://downloads.ohohlfeld.com/talks/hohlfeld_schroeder-publish_subscribe_systems-dsmware_eurecom2007.pdf)

## Versioning

PubSubJS uses [Semantic Versioning](http://semver.org/) for predictable versioning.

## Changelog

Please see [https://github.com/mroderick/PubSubJS/releases](https://github.com/mroderick/PubSubJS/releases)

## License

MIT: http://mrgnrdrck.mit-license.org

## Alternatives

These are a few alternative projects that also implement topic based publish subscribe in JavaScript.

* http://www.joezimjs.com/projects/publish-subscribe-jquery-plugin/
* http://amplifyjs.com/api/pubsub/
* http://radio.uxder.com/ — oriented towards 'channels', free of dependencies
* https://github.com/pmelander/Subtopic - supports vanilla, underscore, jQuery and is even available in NuGet