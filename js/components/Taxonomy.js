import React from 'react';
import Firebase from 'firebase';
import Router from 'react-router';
import { DefaultRoute, Link, Route, RouteHandler, Navigation } from 'react-router';
import auth from '../auth';

let Taxonomy = React.createClass({
	mixins: [Router.Navigation],

	getInitialState(){
		if (!auth.loggedIn()) {
            this.transitionTo('login');
        };
        return { taxonomies: [], name: '', error: '' };
	},

	componentWillMount(){
		this.firebaseDb = new Firebase('https://app-todo-list.firebaseio.com/taxonomy');
        this.moduleFb = new Firebase('https://app-todo-list.firebaseio.com/modules/')
		this.getAllTaxonomies();
	},

    componentWillUnmount(){
        this.firebaseDb.off();
    },

    inputNameTextChange(e){
    	this.setState({ name: e.target.value, nameMessage:'', error: '' });
    },

    getAllTaxonomies(){ //after deleting and adding new items, length of array is not the same as actual. Fix this
    	this.firebaseDb.on('child_added', function(snap){
    		var taxonomyArray = this.state.taxonomies;
    		var items = snap.val();
    		items.id = snap.key();
    		taxonomyArray.push(items);
    		this.setState({taxonomies: taxonomyArray})
    	}.bind(this))
    	this.firebaseDb.on('child_removed', function(snap){
    		var taxonomyArray = this.state.taxonomies;
    		var item = snap.key();
    		console.log(item);
    		for (var i=0; i < taxonomyArray.length; i++) {
		        if (taxonomyArray[i] != undefined && (taxonomyArray[i].id === item)) {
		            if(i>-1){
		            	delete taxonomyArray[i]
		            }
		        }
		    }
		    taxonomyArray.filter(function(e){return e}); 
    		this.setState({taxonomies: taxonomyArray})
    	}.bind(this))
    },

    createTaxonomy(e){
    	e.preventDefault();
    	this.handleValidation(res => {
            if(res){
            	this.firebaseDb.push({
            		name: this.state.name
            	})
            	this.setState({name: ''});
            }
        })
    },

    handleValidation(response){
        response = arguments[arguments.length - 1];
        var err = false;

        if(this.state.name.trim().length == 0){
            this.setState({ nameMessage: 'Enter name.' });
            err = true;
        }

        if(err){ response (false); return; } else { response (true); return; }
    },

	render(){
		var taxonomies = this.state.taxonomies;
        var _singleItems = [];
        var fb = this.firebaseDb;
        var change = this.onChange;

        taxonomies.forEach(function (taxonomy, i) {
            _singleItems.push(<TaxonomyItem key={i} taxonomy={taxonomies[i]} onDelete = {fb} change={change}/>);
        });

		return <div>
				{_singleItems}
				<form onSubmit={this.createTaxonomy} >
						<div><span>Add new taxonomy:</span>
				           <input type = 'text' value = { this.state.name } onChange = {this.inputNameTextChange} />
				           <div>{this.state.nameMessage}</div>
				       </div>
	                    <div><span><button>Create taxonomy</button></span></div>
					</form>
				</div>;
	}
});

let TaxonomyItem = React.createClass({
    getInitialState() {
        return { value: this.props.taxonomy.name, id: this.props.taxonomy.id, error: ''}
    },

    componentWillMount(){
        var deleteFb = this.props.onDelete;
        var selected = this.state.value;
        var moduleFb = new Firebase('https://app-todo-list.firebaseio.com/modules/')
        moduleFb.orderByChild('taxonomy').startAt(selected).endAt(selected).once('value', function(snap){
            var moduleData = snap.val();
            if(moduleData != null){
                for (var k in moduleData){
                    var thismoduleFb = new Firebase(moduleFb + '/' + k);
                    thismoduleFb.once('value', function(snap){
                        var data = snap.val();
                        if(data.taxonomy == selected && data.status == 'active'){
                            this.setState({ error: true})
                        } else {
                            this.setState({ error: false})
                        }
                    }.bind(this))
                }
            }
        }.bind(this))    
    },

    delete(){
    	var deleteFb = this.props.onDelete;
        this.itemFb = new Firebase(deleteFb + '/' + this.state.id);
        this.itemFb.remove();
	},

    render() {
        var taxonomy = this.props.taxonomy;

        return <ul>
                  <li key={ this.state.id }>
                        <span>
                            <div> {this.state.value} </div>
                            <div>
                                
                                {!this.state.error ? (<button type='button' onClick={this.delete}><i> delete </i></button>) : (<div></div>)}
                            </div>
                        </span>
                    </li>
                </ul>;
    }   
});

export default Taxonomy;