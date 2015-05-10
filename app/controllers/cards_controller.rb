class CardsController < ApplicationController
  def index
  	@cards = Card.all
  end

  def create
  	@card = Card.new(card_params)
  	if @card.save
  		render :nothing => true
  	end
  end

  private
    def card_params
      params.require(:card).permit(:url)
    end
end
