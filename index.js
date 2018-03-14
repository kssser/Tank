function throttle(method,delay,duration) {	// 节流函数
	var timer=null;
	var begin=new Date();//与本地时间无关
	return function(){
	    var context=this,args=arguments;
	    var current=new Date();
	    clearTimeout(timer);
	    if (current-begin>=duration) {
	        method.apply(context,args);
	        begin=current;
	    }else{
	        timer=setTimeout(function(){
	            method.apply(context,args);
	        },delay);
	    }
	}
}

// 包含start与end(>=0)
function getRandom(){
	var len=arguments.length,
		start,end;
	if(len){
		if(len==1){
			start=0;
			end=arguments[0];
		}else{
			start=arguments[0];
			end=arguments[1];
		}
	}else{
		console.log('function getRandom parameters can not be empty!');
		return 0;
	}
	return Math.floor(Math.random()*(end+1-start)+start);
}

function Game(){
	var self=this,
		width=$(document).width(),
		height=$(document).height();
	this.status='stop';		// or 'playing' or 'pause'
	this.container={
		dom:$('<div></div>',{'class':'container'}).appendTo($('body')),
		panel:{
			dom:$('<div></div>',{'class':'panel'}),
			width:200,
			height:height
		},
		map:{
			dom:$('<div></div>',{'class':'map'}),
			width:undefined,
			height:height
		},
		width:width,
		height:height
	};
	(function(){
		var iWidth=width-self.container.panel.width,
			dif=iWidth%50;			// 50为tank.size
		self.container.map.width=iWidth-dif;
		self.container.dom.append(self.container.panel.dom.width(self.container.panel.width+dif)).append(self.container.map.dom);
	})();
	this.init=function(){
		self.self={
			life:2,		// 命 2+当前,总共为3
			limit:1,
			tanks:[]
		};
		self.enemy={
			life:20,
			limit:3,
			tanks:[]
		};
		return self;
	};
	this.start=function(){
		self.init().status='playing';
		// create selfTank
		var myTank=new Tank(self,'self',2);
		// create enemyTank
		new Tank(self,'enemy',2);
		new Tank(self,'enemy',2);
		new Tank(self,'enemy',2);
		// 后续完善双键(!!!)
		$(document).on('keydown',function(e){	// 截留!!!
			var code=e.keyCode,
				direction;
			if(code==37||code==65){			// left
				direction='left';
			}else if(code==38||code==87){	// up
				direction='up';
			}else if(code==39||code==68){	// right
				direction='right'
			}else if(code==40||code==83){	// down
				direction='down'
			}else if(code==74){				// j
				myTank.fire();
			}else if(code==32){				// space
				if(self.status=='pause')
					self.continue();
				else if(self.status=='playing')
					self.pause();
			}else{
				console.log(code);
			}
			direction&&myTank.move(direction);
		});
		return self;
	};
	this.continue=function(){
		self.status='playing';
		return self;
	};
	this.pause=function(){
		self.status='pause';
		return self;
	};
	this.end=function(){
		self.status='stop';
		self.pause();
		alert('end');//!!!
		return self;
	};
	this.reset=function(){
		self.start();
	};
	return self;
}

function Shot(game,tank){
	var self=this;
	this.type=tank.type;
	this.rank=tank.rank;
	this.direction=tank.direction;
	this.size=8;
	this.step=25;
	this.rate=100;			// ms
	this.timer=null;		// 运动定时器
	this.dom=$('<span></span>',{'class':'shot'}).css({width:self.size,height:self.size});
	this.position={
		left:0,
		top:0
	};
	this.create=function(){
		if(game.status=='playing'){
			var dif=tank.size-self.size;	// 相对于tank的偏差
			switch(self.direction){
				case 'up':
					self.position.left=tank.position.left+dif/2;
					self.position.top=tank.position.top+self.size;
					break;
				case 'down':
					self.position.left=tank.position.left+dif/2;
					self.position.top=tank.position.top+dif;
					break;
				case 'left':
					self.position.left=tank.position.left+self.size;
					self.position.top=tank.position.top+dif/2;
					break;
				case 'right':
					self.position.left=tank.position.left+dif;
					self.position.top=tank.position.top+dif/2;
					break;
				default:
					console.log('shot direction error');
			}
			self.dom.css(self.position).appendTo(game.container.map.dom);
			self.move();
		}
		return self;
	};
	this.move=function(){
		if(game.status=='playing'){
			self.timer=setInterval(function(){
				if(game.status=='playing'){
					// 运动
					switch(self.direction){
						case 'up':
							self.position.top-=self.step;
							break;
						case 'down':
							self.position.top+=self.step;
							break;
						case 'left':
							self.position.left-=self.step;
							break;
						case 'right':
							self.position.left+=self.step;
							break;
						default:
							console.log('is not move');
					};
					self.dom.animate(self.position,self.rate,'linear',function(){
						var boolOrTank=self.isTouched();
						if(boolOrTank){
							self.destory();
							if(typeof boolOrTank=="object"){
								boolOrTank.destory();
							}
						}
					});
				}
			},self.rate);
		}
		return self;
	};
	this.isTouched=function(){
		// 撞墙
		if((self.position.left<=0)||(self.position.left>=game.container.map.width-self.size)||(self.position.top<=0)||(self.position.top>=game.container.map.height-self.size)){
			return true;
		}
		// 遇敌
		var type=(function(){
			if(self.type=='self'){
				return 'enemy';
			}else{
				return 'self';
			}
		})();
		var shotLeft=self.position.left,
			shotTop=self.position.top,
			shotSize=self.size;
		for(var i=0,len=game[type].tanks.length;i<len;i++){
			var tank=game[type].tanks[i];
				tankLeft=tank.position.left,
				tankTop=tank.position.top,
				tankSize=tank.size;
			if((shotLeft>tankLeft)&&(shotLeft<tankLeft+tankSize)&&(shotTop>tankTop)&&(shotTop<tankTop+tankSize)){
				return tank;
			}
		}
		return false;
	};
	this.destory=function(){
		clearInterval(self.timer);
		self.dom.remove();
		for(var i=tank.shots.length-1;i>=0;i--){
			if(tank.shots[i]==self){
				tank.shots.splice(i,1);
				break;
			}
		}
		self=null;
	};
	return self.create();
}

/**
 * [Tank description]
 * @param type(self,enemy)
 * @param rank(1,2,3)
 */
function Tank(game,type,rank){
	var self=this;
	this.type=type;
	this.rank=rank;
	this.size=50;		// 修改该配置时要修改Game中的map的宽度设置
	this.dom=$('<div></div>',{'class':'tank'}).css({width:self.size,height:self.size});
	this.step=25;					// 运动距离
	this.direction='up';			// 朝向(up、down、left、right)
	this.isMoving=false;
	this.position={
		left:0,
		top:0
	};
	this.shots=[];
	this.shotLimit=3;				// 子弹存在数量
	this.fire=function(){
		if(game.status=='playing'){
			if(self.shots.length<self.shotLimit){
				var shot=new Shot(game,self);
				self.shots.push(shot);
			}
		}
		return self;
	};
	this.create=function(){
		if(game.status=='playing'){
			var position=[{left:0,top:0},{left:(game.container.map.width-self.size)/2,top:0},{left:game.container.map.width-self.size,top:0}],
				len=position.length,
				iWhileNum=0;
			switch(self.type){
				case 'self':
					self.dom.addClass('self');
					self.position.left=Math.floor(game.container.map.width-self.size)/2;
					self.position.top=game.container.map.height-self.size;
					break;
				case 'enemy':
					var idx=getRandom(len-1);
					self.dom.addClass('enemy');
					self.position.left=position[idx].left;
					self.position.top=position[idx].top;
					break;
				default:
					console.log('unknown tank!');
			};
			while(self.isTouched()){
				var b=++iWhileNum<len;
				if(self.type=='self'){
					b?(self.position.left+=Math.pow(-1,iWhileNum)*self.size):(self.position.top-=self.size);
				}
				else{
					b?(self.position.left=position[++idx%len].left):(self.position.top+=self.size,self.position.left=position[++idx%len].left);
				}
			}
			game[self.type].tanks.push(self);
			var isEnemy=self.type=='enemy';
			if(isEnemy){
				self.direction='down';
				self.dom.css({'transform':'rotate(180deg)'});
			}
			self.dom.css(self.position).appendTo(game.container.map.dom);
			isEnemy&&self.move();
		}
		return self;
	};
	this.move=function(direction){
		if(game.status=='playing'&&!self.isMoving){
			var limit,
				sDirection=direction,
				iStep=1,
				isSelf=type=='self';
			self.isMoving=true;
			if(!isSelf){
				sDirection=['up','down','left','right'][getRandom(3)];
				iStep=getRandom(2,8);
				var tempStep=iStep;
			}
			switch(sDirection){
				case 'up':
					if(self.direction!=direction){
						self.direction=direction;
						self.dom.css({'transform':'rotate(0deg)'});
						if(isSelf)
							break;
					}
					limit=0;
					if(isSelf){
						self.position.top-=self.step;
						if(self.isTouched()){
							self.position.top+=self.step;
						}else{
							if(self.position.top<limit){
								self.position.top=limit;
							}
						}
					}else{
						while(tempStep--){
							self.position.top-=self.step;
							if(self.isTouched()){
								iStep--;
								self.position.top+=self.step;
								tempStep=0;
							}else{
								if(self.position.top<limit){
									iStep--;
									self.position.top=limit;
									tempStep=0;
								}
							}
						}
					}
					break;
				case 'down':
					if(self.direction!=direction){
						self.direction=direction;
						self.dom.css({'transform':'rotate(180deg)'});
						if(isSelf)
							break;
					}
					limit=game.container.map.height-self.size;
					if(isSelf){
						self.position.top+=self.step;
						if(self.isTouched()){
							self.position.top-=self.step;
						}else{
							if(self.position.top>limit){
								self.position.top=limit;
							}
						}
					}else{
						while(tempStep--){
							self.position.top+=self.step;
							if(self.isTouched()){
								iStep--;
								self.position.top-=self.step;
								tempStep=0;
							}else{
								if(self.position.top>limit){
									iStep--;
									self.position.top=limit;
									tempStep=0;
								}
							}
						}
					}
					break;
				case 'left':
					if(self.direction!=direction){
						self.direction=direction;
						self.dom.css({'transform':'rotate(270deg)'});
						if(isSelf)
							break;
					}
					limit=0;
					if(isSelf){
						self.position.left-=self.step;
						if(self.isTouched()){
							self.position.top+=self.step;
						}else{
							if(self.position.top<limit){
								self.position.top=limit;
							}
						}
					}else{
						while(tempStep--){
							self.position.left-=self.step;
							if(self.isTouched()){
								iStep--;
								self.position.left+=self.step;
								tempStep=0;
							}else{
								if(self.position.left<limit){
									iStep--;
									self.position.left=limit;
									tempStep=0;
								}
							}
						}
					}
					break;
				case 'right':
					if(self.direction!=direction){
						self.direction=direction;
						self.dom.css({'transform':'rotate(90deg)'});
						if(isSelf)
							break;
					}
					limit=game.container.map.width-self.size;
					if(isSelf){
						self.position.left+=self.step;
						if(self.isTouched()){
							self.position.top-=self.step;
						}else{
							if(self.position.top>limit){
								self.position.top=limit;
							}
						}
					}else{
						while(tempStep--){
							self.position.left+=self.step;
							if(self.isTouched()){
								iStep--;
								self.position.left-=self.step;
								tempStep=0;
							}else{
								if(self.position.left>limit){
									iStep--;
									self.position.left=limit;
									tempStep=0;
								}
							}
						}
					}
					break;
				default:
					console.log('direction error');
			}
			self.dom.animate(self.position,300*(iStep-1),'linear',function(){
				self.isMoving=false;
				if(!isSelf){
					setTimeout(function(){
						self.move();
					},getRandom(0,2000));
				}
			});
		}
		return self;
	};
	this.destory=function(){
		// destory animation
		
		if(--game[self.type].life>=0){
			setTimeout(function(){
				new Tank(game,'enemy',2);
			},1000);
		}else{
			game.end();
		}
		for(var i=0,len=game[self.type].tanks.length;i<len;i++){
			if(self===game[self.type].tanks[i]){
				game[self.type].tanks.splice(i,1);
				break;
			}
		}
		self.dom.remove();
		self=null;
	};
	this.isTouched=function(){
		var tanks=[],
			selfLeft=self.position.left,
			selfTop=self.position.top;
		if(self.type=='self'){
			game.enemy.tanks.forEach(function(item){
				tanks.push(item);
			});
		}else{
			tanks.push(game.self.tanks[0]);
			game.enemy.tanks.forEach(function(item){
				if(item!=self)
					tanks.push(item);
			});
		}
		if(tanks.length==0)
			return false;
		for(var i=0,len=tanks.length;i<len;i++){
			var tank=tanks[i],
				tankLeft=tank.position.left,
				tankTop=tank.position.top,
				tankSize=tank.size;
			if(selfLeft>tankLeft-tankSize&&selfLeft<tankLeft+tankSize&&selfTop>tankTop-tankSize&&selfTop<tankTop+tankSize){
				return true;
			}
		}
		return false;
	};
	return self.create();
}
$(function(){
	var game=new Game().start();
	$(window).on('resize',throttle(function(){
		var width=$(document).width(),
			height=$(document).height(),
			initWidth=game.container.width,
			initHeight=game.container.height;
		if(width!=initWidth){
			game.container.width=width;
			game.container.map.width=width-game.container.panel.width;
		}
		if(height!=initHeight){
			game.container.height=height;
			game.container.panel.height=height;
			game.container.map.height=height;
		}
	},200,300));
});
