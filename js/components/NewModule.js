import React from 'react';
import Firebase from 'firebase';
import Router from 'react-router';
import { DefaultRoute, Link, Route, RouteHandler, Navigation } from 'react-router';
import auth from '../auth';

let NewModule = React.createClass({
	mixins: [Router.Navigation],

	getInitialState() {
      	if (!auth.loggedIn()) {
      		this.transitionTo('login');
      	} else {
            var userStatus = auth.getStatus();
            var userId = auth.getUserId();
            if (userStatus == "created") {
                this.transitionTo('edituser', null, {id: userId});
            }
        }

	  	return { title: '', description: '', taxonomy: [], taxonomySelected: 'General', points: '', repeatable: false, module: {}};
	},

	componentWillMount() {
		this.firebaseDb = new Firebase('https://app-todo-list.firebaseio.com/modules');
		this.taxonomyDb = new Firebase('https://app-todo-list.firebaseio.com/taxonomy');
		this.getTaxonomy();
	},

    componentWillUnmount() {
        this.firebaseDb.off();
    },

    getTaxonomy(){
    	this.taxonomyDb.on('child_added', function(snap){
    		var data = snap.val();
    		data.id = snap.key();
    		var taxonomyArray = this.state.taxonomy;
    		taxonomyArray.push(data);
    		this.setState({taxonomy: taxonomyArray})
    	}.bind(this))
    },

	inputTitleTextChange(e) {
    	this.setState({title: e.target.value, titleMessage: '', message: ''});
	},

	inputDescriptionTextChange(e) {
    	this.setState({description: e.target.value, descriptionMessage: '', message: ''});
	},

	inputTaxonomyChange(e) {
    	this.setState({taxonomySelected: e.target.value});
	},

	inputPointsTextChange(e) {
    	this.setState({points: e.target.value, pointsMessage: '', message: ''});
	},

	checkboxRepeatableChange(e) {
    	this.setState({repeatable: e.target.checked});
	},

	createModule(e) {
        e.preventDefault();
        this.handleValidation(res => {
            if(res){
	            this.firebaseDb.push({
	                title: this.state.title,
					description: this.state.description,
					taxonomy: this.state.taxonomySelected,
					repeatable: this.state.repeatable,
					points: this.state.points
	            });
	            this.setState({title: '', description: '', taxonomy: '', taxonomySelected: 'General', repeatable: '', points: ''});
				this.transitionTo('moduleslist');
        	}
    	})
    },

    cancel() {
    	this.transitionTo('moduleslist');
    },

    handleValidation(response){
        response = arguments[arguments.length - 1];
        var err = false;
        var onlyNumeric = /^\d+$/;

        if(this.state.title.trim().length == 0){
            this.setState({ titleMessage: 'Enter title.' });
            err = true;
        }
        if(this.state.description.trim().length == 0){
            this.setState({ descriptionMessage: 'Enter description.' });
            err = true;
        }
        if(this.state.points.trim().length == 0){
            this.setState({ pointsMessage: 'Enter points.' });
            err = true;
        }
        if(!onlyNumeric.test(this.state.points)){
            this.setState({ pointsMessage: 'Enter numeric value.' });
            err = true;
        }
        if(err){ response (false); return; } else { response (true); return; }
    },

	render() {
        if(this.state.taxonomy != ''){
            var optionNodes = this.state.taxonomy.map(function(option){
                    return <option value={option.value}>{option.name}</option>;
            });
        }

		return <div id='changeData-form'>
                <fieldset>
        			<form onSubmit={this.createModule} >
    		            <input type='text' placeholder='Title' value={this.state.title} onChange={this.inputTitleTextChange} />
    		            <div className='errorMessage'>{this.state.titleMessage}</div>
                        <input type='text' placeholder='Points' value={this.state.points} onChange={this.inputPointsTextChange} />
                        <div className='errorMessage'>{this.state.pointsMessage}</div>
    		            <textarea rows={8} placeholder='Description' value={this.state.description} onChange={this.inputDescriptionTextChange} />
    		            <div className='errorMessage'>{this.state.descriptionMessage}</div>
                        <select className='adminFont' value={this.state.taxonomySelected} onChange={this.inputTaxonomyChange}>{optionNodes}</select>
                        <div className='checkbox'><span className='adminFont'>Repeatable</span>
        		            <input type ='checkbox' checked={this.state.repeatable} onChange={this.checkboxRepeatableChange} />
        		        </div>
                        <input type='submit' value='Add new module'/>
        			</form>
                </fieldset>
		      </div>;
	}
});

export default NewModule;
