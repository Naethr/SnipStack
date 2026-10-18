class Api::V1::SnippetsController < ApplicationController
  before_action :authenticate_user!
  before_action :set_snippet, only: %i[show update destroy]

  def index
    snippets = current_user.snippets.newest_first
    render json: snippets.map { |snippet| serialize_snippet(snippet) }
  end

  def show
    render json: serialize_snippet(@snippet)
  end

  def create
    snippet = current_user.snippets.new(snippet_params)

    if snippet.save
      render json: serialize_snippet(snippet), status: :created
    else
      render json: { errors: snippet.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def update
    if @snippet.update(snippet_params)
      render json: serialize_snippet(@snippet)
    else
      render json: { errors: @snippet.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def destroy
    @snippet.destroy
    head :no_content
  end

  private

  def set_snippet
    @snippet = current_user.snippets.find(params[:id])
  end

  def snippet_params
    params.require(:snippet).permit(:title, :description, :language, :code, :tags)
  end

  def serialize_snippet(snippet)
    {
      id: snippet.id,
      title: snippet.title,
      description: snippet.description,
      language: snippet.language,
      code: snippet.code,
      tags: snippet.tags,
      created_at: snippet.created_at,
      updated_at: snippet.updated_at
    }
  end
end
