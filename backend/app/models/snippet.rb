class Snippet < ApplicationRecord
  before_validation :normalize_fields

  validates :title, presence: true, length: { maximum: 100 }
  validates :description, length: { maximum: 500 }, allow_blank: true
  validates :language, presence: true, length: { maximum: 50 }
  validates :code, presence: true, length: { maximum: 20_000 }
  validates :tags, length: { maximum: 300 }, allow_blank: true

  scope :newest_first, -> { order(created_at: :desc, id: :desc)}

  private

  def normalize_fields
    self.title = title.to_s.strip
    self.description = description.to_s.strip if description.present?
    self.language = language.to_s.strip if language.present?
    self.code = code.to_s.strip if code.present?
    self.tags = normalize_tags(tags)
  end

  def normalize_tags(raw_tags)
    raw_tags.to_s.split(",").map { |tag| tag.strip.downcase }.reject(&:blank?).uniq.join(", ").presence
  end
end